defmodule TutoKBRWStack do
  use Application

  @impl true
  def start(_type, _args) do
    pid = Server.ServSupervisor.start_link(name: Server.ServSupervisor)

    Application.put_env(
      :reaxt,
      :global_config,
      Map.merge(
        Application.get_env(:reaxt, :global_config),
        %{localhost: "http://0.0.0.0:4001"}
      )
    )

    Reaxt.reload()

    json_files =
      0..1
      |> Enum.map(fn n ->
        "../../orders_dump/orders_chunk#{n}.json"
      end)

    Enum.each(json_files, &JsonLoader.load_to_database(Server.Database, &1))

    # {:ok, _} = Riak.upload_schema(Riak.orders_schema_name, "./schema/order_schema.xml")
    # {:ok, _} = Riak.create_index(Riak.orders_index_name, Riak.orders_schema_name)
    # {:ok, _} = Riak.assign_index(Riak.orders_index_name, Riak.orders_bucket)

    # json_files
    # |> Enum.each(fn json_file ->
    #   {:ok, _} = JsonLoader.load_to_riak(json_file)
    # end)

    pid
  end
end
