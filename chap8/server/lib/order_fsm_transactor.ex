defmodule OrderFsmTransactor do
  use GenServer, restart: :transient

  @timeout 5000

  def start_link(order_id) do
    GenServer.start_link(__MODULE__, order_id, [])
  end

  @impl true
  def init(order_id) do
    {:ok, {_, order}} = Riak.get(Riak.orders_bucket(), order_id)
    {:ok, order, @timeout}
  end

  def get_order(pid) do
    case GenServer.whereis(pid) do
      nil -> {:error, :not_found}
      pid -> {:ok, pid}
    end
  end

  @impl true
  def handle_info(:timeout, order) do
    Riak.put(Riak.orders_bucket(), order["id"], Poison.encode!(order))
    {:stop, :normal, order}
  end
end
