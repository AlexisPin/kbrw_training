defmodule TutoKBRWStack do
  use Application

  @impl true
  def start(_type, _args) do
    pid = Server.ServSupervisor.start_link(name: Server.ServSupervisor)

    0..1
    |> Enum.each(fn n ->
      JsonLoader.load_to_database(Server.Database, "../orders_dump/orders_chunk#{n}.json")
    end)

    pid
  end
end
