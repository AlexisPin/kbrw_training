defmodule Server.Database do
  use GenServer

  ## Client API

  def start_link(opts) do
    server = Keyword.fetch!(opts, :name)
    GenServer.start_link(__MODULE__, server, opts)
  end

  def create(server, name, value \\ 0) do
    GenServer.call(server, {:create, name, value})
  end

  def lookup(server, name) do
    case :ets.lookup(server, name) do
      [{^name, value}] -> {:ok, value}
      [] -> :error
    end
  end

  def delete(server, key) do
    GenServer.call(server, {:delete, key})
  end

  def update(server, key, value) do
    GenServer.call(server, {:update, key, value})
  end

  def search(database, criteria) when is_atom(database) and is_list(criteria) do
    all_records = :ets.tab2list(database)

    matching_records =
      all_records
      |> Enum.map(fn {_id, record} -> record end)
      |> Enum.filter(&matches_any_criteria?(&1, criteria))

    {:ok, matching_records}
  end

  def search(_database, _criteria) do
    {:error, "Invalid arguments: database must be an atom, criteria must be a list"}
  end

  defp matches_any_criteria?(record, criteria) when is_map(record) and is_list(criteria) do
    Enum.any?(criteria, fn {key, value} ->
      Map.get(record, key) == value
    end)
  end

  defp matches_any_criteria?(_, _), do: false

  ## Server callbacks
  @impl true
  def init(server) do
    items = :ets.new(server, [:public, :named_table, :ordered_set, read_concurrency: true])
    {:ok, items}
  end

  @impl true
  def handle_call({:create, name, value}, _from, items) do
    case :ets.insert_new(items, {name, value}) do
      true -> {:reply, :ok, items}
      false -> {:reply, {:error, :already_exists}, items}
    end
  end

  @impl true
  def handle_call({:update, name, value}, _from, items) do
    case lookup(items, name) do
      {:ok, _} ->
        :ets.insert(items, {name, value})
        {:reply, :ok, items}

      :error ->
        {:reply, {:error, :not_found}, items}
    end
  end

  @impl true
  def handle_call({:delete, key}, _from, items) do
    case lookup(items, key) do
      {:ok, _} ->
        :ets.delete(items, key)
        {:reply, :ok, items}

      :error ->
        {:reply, {:error, :not_found}, items}
    end
  end
end
