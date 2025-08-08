defmodule Riak do
  def url, do: "https://kbrw-sb-tutoex-riak-gateway.kbrw.fr"
  def orders_bucket, do: "alexispin_orders"
  def orders_schema_name, do: "alexispin_orders_schema"
  def orders_index_name, do: "alexispin_orders_index"

  def auth_header do
    username = "sophomore"
    password = "jlessthan3tutoex"
    auth = :base64.encode_to_string("#{username}:#{password}")
    [{~c"authorization", ~c"Basic #{auth}"}]
  end

  def buckets do
    {:ok, {{_, 200, _message}, _headers, body}} =
      :httpc.request(:get, {~c"#{Riak.url()}/buckets?buckets=true", Riak.auth_header()}, [], [])

    {:ok, body}
  end

  def get_keys(bucket) do
    {:ok, {{_, 200, _message}, _headers, body}} =
      :httpc.request(
        :get,
        {~c"#{Riak.url()}/buckets/#{bucket}/keys?keys=true", Riak.auth_header()},
        [],
        []
      )

    {:ok, body}
  end

  def put(bucket, key, value) do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :put,
        {~c"#{Riak.url()}/buckets/#{bucket}/keys/#{key}", Riak.auth_header(),
         ~c"application/json", value},
        [],
        []
      )

    case code do
      code when code in [200, 201, 204, 300] -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def get(bucket, key) do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :get,
        {~c"#{Riak.url()}/buckets/#{bucket}/keys/#{key}", Riak.auth_header()},
        [],
        []
      )

    case code do
      code when code in [200, 300, 304] -> {:ok, {code, Poison.decode!(body)}}
      code -> {:error, {code, body}}
    end
  end

  def delete(bucket, key) do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :delete,
        {~c"#{Riak.url()}/buckets/#{bucket}/keys/#{key}", Riak.auth_header()},
        [],
        []
      )

    case code do
      204 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def upload_schema(schema_name, schema_path) do
    schema = File.read!(schema_path)

    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :put,
        {~c"#{Riak.url()}/search/schema/#{schema_name}", Riak.auth_header(), ~c"application/xml",
         schema},
        [],
        []
      )

    case code do
      204 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def create_index(index, schema) do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :put,
        {~c"#{Riak.url()}/search/index/#{index}", Riak.auth_header(), ~c"application/json",
         "{\"schema\": \"#{schema}\"}"},
        [],
        []
      )

    case code do
      204 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def assign_index(index, bucket) do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :put,
        {~c"#{Riak.url()}/buckets/#{bucket}/props", Riak.auth_header(), ~c"application/json",
         "{\"props\": {\"search_index\": \"#{index}\"}}"},
        [],
        []
      )

    case code do
      204 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def indexes() do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :get,
        {~c"#{Riak.url()}/search/index", Riak.auth_header()},
        [],
        []
      )

    case code do
      200 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def empty_bucket(bucket) do
    keys = Poison.decode!(elem(get_keys(bucket), 1))["keys"]

    Task.async_stream(
      keys,
      fn key ->
        delete(bucket, key)
      end,
      max_concurrency: 10
    )
    |> Stream.run()

    :ok
  end

  def delete_bucket(bucket) do
    empty_bucket(bucket)

    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :delete,
        {~c"#{Riak.url()}/buckets/#{bucket}/props", Riak.auth_header()},
        [],
        []
      )

    case code do
      204 -> {:ok, {code, body}}
      code -> {:error, {code, body}}
    end
  end

  def search(index, query, page \\ 0, rows \\ 30, sort \\ "creation_date_index") do
    {:ok, {{_, code, _message}, _headers, body}} =
      :httpc.request(
        :get,
        {~c"#{Riak.url()}/search/query/#{index}/?wt=json&q=#{query}&start=#{page}&rows=#{rows}&sort=#{sort}%20ASC",
         Riak.auth_header()},
        [],
        []
      )

    case code do
      200 -> {:ok, {code, Poison.decode!(body)["response"]}}
      code -> {:error, {code, body}}
    end
  end

  def escape(string) do
    string
    |> String.replace(~r/[+&|!(){}[\]^"~*?:\/]/, fn
      "+" -> "\\+"
      "&" -> "\\&"
      "|" -> "\\|"
      "!" -> "\\!"
      "(" -> "\\("
      ")" -> "\\)"
      "{" -> "\\{"
      "}" -> "\\}"
      "[" -> "\\["
      "]" -> "\\]"
      "^" -> "\\^"
      "\"" -> "\\\""
      "~" -> "\\~"
      "*" -> "\\*"
      "?" -> "\\?"
      ":" -> "\\:"
      "/" -> "\\/"
      "\\" -> "%5C"
      other -> other
    end)
  end

  def initialize_commands(bucket) do
    keys = Poison.decode!(elem(Riak.get_keys(bucket), 1))["keys"]
    Task.async_stream(
      keys,
      fn key ->
        case Riak.get(bucket, key) do
          {:ok, {_, order}} ->
            case order["status"]["state"] do
              "init" ->
                :ok

              _ ->
                order = Map.put(order, "status", %{"state" => "init"})
                Riak.put(bucket, key, Poison.encode!(order))
            end

          _ ->
            {:error, "Failed to get order with key #{key}"}
        end
      end,
      max_concurrency: 10
    )
    |> Stream.run()
  end
end
