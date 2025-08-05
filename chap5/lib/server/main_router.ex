defmodule Server.MainRouter do
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  forward("/api", to: Server.TheFirstPlug)
  forward("/", to: Server.StaticRouter)
end
