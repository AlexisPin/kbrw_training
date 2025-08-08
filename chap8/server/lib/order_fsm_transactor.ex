defmodule OrderFsmTransactor do
  use GenServer, restart: :transient

  @timeout 5 * 60 * 1000

  def start_link(order_id) do
    GenServer.start_link(__MODULE__, order_id, [])
  end

  def pay(server), do: GenServer.call(server, :pay)

  def verify(server), do: GenServer.call(server, :verify)

  def get(pid) do
    case GenServer.whereis(pid) do
      nil -> {:error, :not_found}
      pid -> GenServer.call(pid, :get)
    end
  end

  @impl true
  def init(order_id) do
    {:ok, {_, order}} = Riak.get(Riak.orders_bucket(), order_id)
    {:ok, order, @timeout}
  end

  @impl true
  def handle_call(:get, _from, order) do
    {:reply, order, order, @timeout}
  end

  @impl true
  def handle_call(:pay, _from, order) do
    handle_event_and_update_order(:process_payment, order)
  end

  @impl true
  def handle_call(:verify, _from, order) do
    handle_event_and_update_order(:verification, order)
  end

  @impl true
  def handle_info(:timeout, order) do
    Riak.put(Riak.orders_bucket(), order["id"], Poison.encode!(order))
    {:stop, :normal, order}
  end

  defp handle_event_and_update_order(event, order) when is_atom(event) do
    case ExFSM.Machine.event(order, {event, []}) do
      {:next_state, updated_order} ->
        {:ok, _} = Riak.put(Riak.orders_bucket(), updated_order["id"], Poison.encode!(updated_order))
        {:reply, updated_order, updated_order, @timeout}

      _ ->
        {:reply, :action_unavailable, order, @timeout}
    end
  end
end
