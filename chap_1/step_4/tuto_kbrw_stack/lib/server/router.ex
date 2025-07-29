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
  alias Server.Database

  plug(:match)
  plug(:dispatch)

  defp resp_with_json(conn, status, data) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Poison.encode!(data))
  end

  get("/", do: send_resp(conn, 200, "Welcome"))

  get "/health" do
    resp_with_json(conn, 200, %{status: "ok"})
  end

  post "/items" do
    case body(conn) do
      {:ok, body, _conn} ->
        case Poison.decode(body) do
          {:ok, data} when is_map(data) ->
            item_map =
              case Map.get(data, "id") do
                nil -> Map.put(data, "id", generate_unique_id())
                _id -> data
              end

            id = Map.get(item_map, "id")

            case Database.create(Database, id, item_map) do
              :ok ->
                resp_with_json(conn, 201, %{
                  message: "Item created successfully",
                  item: item_map
                })

              {:error, :already_exists} ->
                resp_with_json(conn, 409, %{
                  error: "Item already exists",
                  id: id
                })
            end

          _ ->
            resp_with_json(conn, 400, %{
              error: ~s(Invalid JSON format. Expected a JSON object with item data")
            })
        end

      {:error, reason} ->
        resp_with_json(conn, 400, %{error: "Failed to read request body: #{reason}"})
    end
  end

  get "/items/:id" do
    id = URI.decode(id)

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

  put "/items/:id" do
    id = URI.decode(id)

    case body(conn) do
      {:ok, body, _conn} ->
        case Poison.decode(body) do
          {:ok, update_data} when is_map(update_data) ->
            with {:ok, existing_item} <- Server.Database.lookup(Database, id),
                 updated_item <-
                   Map.merge(existing_item, update_data)
                   |> Map.put("id", id),
                 :ok <-
                   Server.Database.update(
                     Database,
                     id,
                     updated_item
                   ) do
              resp_with_json(conn, 200, %{
                message: "Item updated successfully",
                item: updated_item
              })
            else
              _ ->
                resp_with_json(conn, 404, %{
                  error: "Item not found",
                  id: id
                })
            end

          _ ->
            resp_with_json(conn, 400, %{
              error: ~s(Invalid JSON format. Expected a JSON object with item data")
            })
        end

      {:error, reason} ->
        resp_with_json(conn, 400, %{error: "Failed to read request body: #{reason}"})
    end
  end

  delete "/items/:id" do
    id = URI.decode(id)

    case Server.Database.lookup(Database, id) do
      {:ok, _value} ->
        Server.Database.delete(Database, id)

        resp_with_json(conn, 200, %{
          message: "Item deleted successfully",
          id: id
        })

      :error ->
        resp_with_json(conn, 404, %{
          error: "Item not found",
          id: id
        })
    end
  end

  get "/search" do
    %{query_string: query_string} = conn
    Plug.Conn.Utils.validate_utf8!(query_string, InvalidQueryError, "query string")
    query_params = Plug.Conn.Query.decode(query_string)

    criteria =
      query_params
      |> Enum.map(fn {key, value} ->
        parsed_value =
          case Integer.parse(value) do
            {int_val, ""} ->
              int_val

            _ ->
              case Float.parse(value) do
                {float_val, ""} ->
                  float_val

                _ ->
                  String.trim(value, "\"")
              end
          end

        {key, parsed_value}
      end)

    case criteria do
      [] ->
        resp_with_json(conn, 400, %{
          error: "No search criteria provided",
          example: "/search?id=test&value=123"
        })

      _ ->
        case Database.search(Database, criteria) do
          {:ok, results} ->
            resp_with_json(conn, 200, %{
              results: results
            })

          {:error, reason} ->
            resp_with_json(conn, 400, %{
              error: reason,
              criteria: criteria
            })
        end
    end
  end

  get "/items" do
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

  defp generate_unique_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
  end

  defp body(conn) do
    case Plug.Conn.read_body(conn) do
      {:ok, body, conn} -> {:ok, body, conn}
      {:more, _partial_body, _conn} -> {:error, "Body too large"}
      error -> error
    end
  end
end
