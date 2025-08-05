defmodule Riak do
  def url, do: "https://kbrw-sb-tutoex-riak-gateway.kbrw.fr"

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

  def bucket_keys(bucket) do
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
      code when code in [200, 300, 304] -> {:ok, {code, body}}
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
        :post,
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
    keys = Poison.decode!(elem(bucket_keys(bucket), 1))["keys"]
    Enum.each(keys, fn key ->
      delete(bucket, key)
    end)
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
end
