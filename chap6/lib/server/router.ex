defmodule Server.TheFirstPlug do
  use Plug.Router
  alias Server.Database

  plug(:match)
  plug(:dispatch)

  get("/", do: send_resp(conn, 200, "Welcome"))

  get "/health" do
    resp_with_json(conn, 200, %{status: "ok"})
  end

  post "/orders" do
    case body(conn) do
      {:ok, body} ->
        case body["id"] do
          id when is_binary(id) ->
            case Database.create(Database, id, body) do
              :ok ->
                resp_with_json(conn, 201, %{message: "Item created successfully", id: id})

              {:error, reason} ->
                resp_with_json(conn, 500, %{error: "Failed to create item", reason: reason})
            end

          _ ->
            resp_with_json(conn, 400, %{error: "Invalid ID format"})
        end

      _ ->
        resp_with_json(conn, 400, %{error: "Bad Request"})
    end
  end

  get "/order/:id" do
    case Database.lookup(Database, id) do
      {:ok, data} ->
        resp_with_json(conn, 200, data)

      :error ->
        resp_with_json(conn, 404, %{
          error: "Item not found",
          id: id
        })
    end
  end

  put "/order/:id" do
    case body(conn) do
      {:ok, body} ->
        case body["id"] do
          body_id when is_binary(body_id) and body_id == id ->
            case Database.update(Database, id, body) do
              :ok ->
                resp_with_json(conn, 200, %{message: "Item updated successfully", id: id})

              {:error, reason} ->
                resp_with_json(conn, 404, %{error: "Failed to update item", reason: reason})
            end

          _ ->
            resp_with_json(conn, 400, %{error: "ID mismatch"})
        end

      _ ->
        resp_with_json(conn, 400, %{error: "Bad Request"})
    end
  end

  delete "/order/:id" do
    case Database.delete(Database, id) do
      :ok ->
        :timer.sleep(1000)

        resp_with_json(conn, 200, %{
          message: "Item deleted successfully",
          id: id
        })

      {:error, :not_found} ->
        resp_with_json(conn, 404, %{
          error: "Item not found",
          id: id
        })
    end
  end

  get "/search" do
    conn = fetch_query_params(conn)
    criterias = conn.params |> Map.to_list()

    case Database.search(Database, criterias) do
      {:ok, results} ->
        resp_with_json(conn, 200, %{
          results: results
        })

      {:error, reason} ->
        resp_with_json(conn, 400, %{
          error: reason,
          criterias: criterias
        })
    end
  end

  get "/orders" do
    records = :ets.tab2list(Database)

    items =
      Enum.map(records, fn {id, value} ->
        %{id: id, value: value}
      end)

    resp_with_json(conn, 200, %{
      items: items
    })
  end

  match _ do
    resp_with_json(conn, 404, %{error: "Page not found"})
  end

  defp resp_with_json(conn, status, data) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Poison.encode!(data))
  end

  defp body(conn) do
    case Plug.Conn.read_body(conn) do
      {:ok, body, _conn} ->
        case Poison.decode(body) do
          {:ok, data} -> {:ok, data}
          {:error, error} -> {:error, error}
        end

      {:more, _partial_body, _conn} ->
        {:error, "Body too large"}

      error ->
        error
    end
  end
end
