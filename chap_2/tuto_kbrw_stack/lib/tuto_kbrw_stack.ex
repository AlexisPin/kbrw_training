defmodule TutoKBRWStack do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: Server.TheFirstPlug, options: [port: 4001]}
    ]

    opts = [strategy: :one_for_one, name: TutoKBRWStack.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
