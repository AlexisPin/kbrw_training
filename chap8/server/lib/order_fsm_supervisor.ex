defmodule OrderFsmSupervisor do
  use DynamicSupervisor

  def start_link(opts) do
    DynamicSupervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def get_or_start_order_fsm(order_id) do
    case DynamicSupervisor.which_children(__MODULE__)
         |> Enum.find(fn {_, pid, _, _} ->
           case OrderFsmTransactor.get(pid) do
             {:error, :not_found} -> false
             order -> order["id"] == order_id
           end
         end) do
      nil ->
        DynamicSupervisor.start_child(__MODULE__, {OrderFsmTransactor, order_id})

      {_, pid, _, _} ->
        {:ok, pid}
    end
  end
end
