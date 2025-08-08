defimpl ExFSM.Machine.State, for: Map do
  def state_name(order), do: String.to_atom(order["status"]["state"])
  def set_state_name(order, name), do: put_in(order, ["status", "state"], Atom.to_string(name))
  def handlers(_order), do: [MyFSM]
end

defmodule MyFSM do
  use ExFSM

  deftrans init({:process_payment, []}, order) do
    {:next_state, :not_verified, order}
  end

  deftrans not_verified({:verification, []}, order) do
    {:next_state, :finished, order}
  end
end
