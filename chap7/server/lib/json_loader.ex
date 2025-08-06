defmodule JsonLoader do
  def load_to_database(database, json_file) do
    with {:ok, json_data} <- read_file(json_file),
         {:ok, decoded_data} <- decode_json(json_data),
         {:ok, count} <- store_in_ets(database, decoded_data) do
      {:ok, count}
    else
      {:error, reason} -> {:error, reason}
    end
  end

  def load_to_riak(json_file) do
    with {:ok, json_data} <- read_file(json_file),
         {:ok, decoded_data} <- decode_json(json_data) do
      Stream.map(decoded_data, fn record ->
        {record["id"], Poison.encode!(record)}
      end)
      |> Task.async_stream(fn {id, json} ->
        Riak.put(Riak.orders_bucket, id, json)
      end, max_concurrency: 10)
      |> Stream.run()
      {:ok, :loaded}
    else
      {:error, reason} -> {:error, reason}
    end
end

  defp read_file(json_file) do
    case File.read(json_file) do
      {:ok, content} -> {:ok, content}
      {:error, :enoent} -> {:error, "File not found: #{json_file}"}
      {:error, :eacces} -> {:error, "Permission denied: #{json_file}"}
      {:error, reason} -> {:error, "Failed to read file: #{reason}"}
    end
  end

  defp decode_json(json_string) do
    case Poison.decode(json_string) do
      {:ok, data} when is_list(data) -> {:ok, data}
      {:ok, _} -> {:error, "JSON must contain an array of objects"}
      {:error, reason} -> {:error, "JSON decode error: #{reason}"}
    end
  end

  defp store_in_ets(database, data_list) do
    results = Enum.map(data_list, &store_record(database, &1))

    case Enum.find(results, &match?({:error, _}, &1)) do
      nil ->
        count = length(results)
        {:ok, count}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp store_record(database, record) when is_map(record) do
    case extract_id(record) do
      {:ok, id} ->
        :ets.insert(database, {id, record})
        {:ok, id}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp store_record(_, _) do
    {:error, "Each record must be a map/object"}
  end

  defp extract_id(record) do
    case Map.get(record, "id") do
      nil ->
        {:error, "Record missing 'id' field: #{inspect(record)}"}

      id ->
        {:ok, to_string(id)}
    end
  end
end
