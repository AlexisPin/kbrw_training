defmodule OrderFsmSupervisor do
  use DynamicSupervisor

  def start_link(opts) do
    DynamicSupervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def start_order_fsm(order_id) do
    case DynamicSupervisor.which_children(__MODULE__) do
      {:ok, children} ->
        case Enum.find(children, fn {_, pid, _, _} -> pid == order_id end) do
          nil ->
            DynamicSupervisor.start_child(__MODULE__, {OrderFsmTransactor, order_id})

          {_, pid, _, _} ->
            {:ok, pid}
        end

      {:error, _reason} ->
        {:error, :supervisor_not_started}
    end
  end
end
