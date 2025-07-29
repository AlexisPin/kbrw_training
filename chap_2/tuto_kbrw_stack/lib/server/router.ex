defmodule Server.TheFirstPlug do
  ## Step 1

  # def init(opts), do: opts

  # def call(conn, _opts) do
  #   case conn.request_path do
  #     "/" ->
  #       send_resp(conn, 200, "Welcome to the new world of Plugs!")

  #     "/me" ->
  #       send_resp(conn, 200, "I am The First, The One, Le Geant Plug Vert, Le Grand Plug, Le Plug Cosmique.")

  #     _ ->
  #       send_resp(conn, 404, "Go away, you are not welcome here.")
  #   end
  # end

  ## Step 2

  # use Server.TheCreator

  # my_error code: 404, content: "Custom error message"

  # my_get "/" do
  #   {200, "Welcome to the new world of Plugs!"}
  # end

  # my_get "/me" do
  #   {200, "You are the Second One."}
  # end

  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get("/", do: send_resp(conn, 200, "Welcome"))

  match(_, do: send_resp(conn, 404, "Page Not Found"))
end
