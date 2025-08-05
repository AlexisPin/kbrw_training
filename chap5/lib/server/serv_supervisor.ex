defmodule Server.ServSupervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    children = [
      {Server.Database, name: Server.Database},
      {Plug.Cowboy, scheme: :http, plug: Server.MainRouter, options: [port: 4001]}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
