defmodule TutoKBRWStack do
  use Application

  @impl true
  def start(_type, _args) do
    pid = Server.ServSupervisor.start_link(name: Server.ServSupervisor)


    json_files = 0..1
    |> Enum.map(fn n ->
      "../orders_dump/orders_chunk#{n}.json"
    end)

    json_files
    |> Enum.each(fn json_file ->
      JsonLoader.load_to_database(Server.Database, json_file)
    end)

    {:ok, _} = Riak.upload_schema(Riak.orders_schema_name, "./schema/order_schema.xml")
    {:ok, _} = Riak.create_index(Riak.orders_index_name, Riak.orders_schema_name)
    {:ok, _} = Riak.assign_index(Riak.orders_index_name, Riak.orders_bucket)

    json_files
    |> Enum.each(fn json_file ->
      {:ok, _} = JsonLoader.load_to_riak(json_file)
    end)

    pid
  end
end
