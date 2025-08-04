defmodule Server.MainRouter do
  use Plug.Router

  plug(Plug.Static, from: "priv/static", at: "/static")
  plug(:match)
  plug(:dispatch)

  forward("/api", to: Server.TheFirstPlug)

  get(_, do: send_file(conn, 200, "priv/static/index.html"))
  
  match(_, do: send_resp(conn, 404, "Not found"))
end
