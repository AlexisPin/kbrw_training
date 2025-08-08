defmodule Server.TheFirstPlug do
  use Plug.Router
  alias Server.Database

  plug(:match)
  plug(:dispatch)

  post "/orders" do
    case body(conn) do
      {:ok, body} ->
        case body["id"] do
          id when is_binary(id) ->
            case Riak.put(Riak.orders_bucket(), id, body) do
              {:ok, {_, response}} ->
                resp_with_json(conn, 201, response)

              _ ->
                not_found(conn, "Failed to create item")
            end

          _ ->
            resp_with_json(conn, 400, %{error: "Invalid ID format"})
        end

      _ ->
        resp_with_json(conn, 400, %{error: "Bad Request"})
    end
  end

  get "/order/:id" do
    case Riak.get(Riak.orders_bucket(), id) do
      {:ok, {_code, data}} ->
        resp_with_json(conn, 200, data)

      _ ->
        not_found(conn, "Failed to retrieve item")
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
                not_found(conn, "Failed to update item: #{reason}")
            end

          _ ->
            resp_with_json(conn, 400, %{error: "ID mismatch"})
        end

      _ ->
        resp_with_json(conn, 400, %{error: "Bad Request"})
    end
  end

  put "/order/:id/pay" do
    {:ok, pid} = OrderFsmSupervisor.get_or_start_order_fsm(id)

    case OrderFsmTransactor.pay(pid) do
      :action_unavailable -> resp_with_json(conn, 401, %{error: "Action of paying is unauthorized"})
      updated_order -> resp_with_json(conn, 200, updated_order)
    end
  end

  put "/order/:id/verify" do
    {:ok, pid} = OrderFsmSupervisor.get_or_start_order_fsm(id)

    case OrderFsmTransactor.verify(pid) do
      :action_unavailable -> resp_with_json(conn, 401, %{error: "Action of verifying is unauthorized"})
      updated_order -> resp_with_json(conn, 200, updated_order)
    end
  end

  delete "/order/:id" do
    case Riak.delete(Riak.orders_bucket(), id) do
      {:ok, {204, _}} ->
        :timer.sleep(1000)
        send_resp(conn, 204, "")

      {:error, {404, _}} ->
        not_found(conn, "Item not found")
    end
  end

  get "/orders" do
    conn = fetch_query_params(conn)
    page = get_or_default(conn.query_params, "page", 0)
    sort = get_or_default(conn.query_params, "sort", "creation_date_index")
    rows = get_or_default(conn.query_params, "rows", 30)
    query = format_query_params(conn.query_params)

    query =
      URI.encode_www_form(
        case query do
          "" -> "*:*"
          _ -> query
        end
      )

    case Riak.search(Riak.orders_index_name(), query, page, rows, sort) do
      {:ok, {200, results}} ->
        resp_with_json(conn, 200, results["docs"])

      {:error, {code, body}} ->
        resp_with_json(conn, code, %{error: body})
    end
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
          {:ok, data} when is_map(data) ->
            {:ok, data}

          {:error, _} ->
            {:error, "Invalid JSON format"}
        end

      {:more, _partial_body, _conn} ->
        {:error, "Body too large"}

      error ->
        error
    end
  end

  defp not_found(conn, message) do
    resp_with_json(conn, 404, %{error: message})
  end

  defp get_or_default(params, key, default) do
    case Map.get(params, key) do
      nil -> default
      value -> value |> String.trim() |> Riak.escape()
    end
  end

  defp format_query_params(params) do
    for {key, value} <- params,
        is_binary(key) and is_binary(value),
        key = String.trim(key) |> Riak.escape(),
        value = String.trim(value) |> Riak.escape(),
        key != "" and value != "" do
      {key, value}
    end
    |> Enum.reject(fn {key, _value} -> key in ["page", "sort", "rows"] end)
    |> Enum.map_join(" AND ", fn {key, value} -> "#{key}:#{value}" end)
  end
end
