defmodule Server.DatabaseTest do
  use ExUnit.Case, async: true

  setup context do
    _ = start_supervised!({Server.Database, name: context.test})
    %{orders: context.test}
  end

  test "find item", %{orders: orders} do
    assert Server.Database.lookup(orders, "water") == :error

    assert :ok = Server.Database.create(orders, "water")
    assert {:error, :already_exists} = Server.Database.create(orders, "water")
  end

  test "create item", %{orders: orders} do
    assert Server.Database.lookup(orders, "water") == :error

    qty = 5
    Server.Database.create(orders, "water", qty)
    assert {:ok, ^qty} = Server.Database.lookup(orders, "water")
  end

  test "update item", %{orders: orders} do
    assert {:error, :not_found} = Server.Database.update(orders, "water", 1)
    qty = 0
    Server.Database.create(orders, "water", qty)

    new_qty = 4
    assert :ok = Server.Database.update(orders, "water", new_qty)

    assert {:ok, ^new_qty} = Server.Database.lookup(orders, "water")
  end

  test "delete item", %{orders: orders} do
    Server.Database.create(orders, "water")

    Server.Database.delete(orders, "water")

    assert :error = Server.Database.lookup(orders, "water")
  end

  test "search orders", %{orders: kv_db} do
    orders = [
      %{"id" => "toto", "key" => 42},
      %{"id" => "test", "key" => "42"},
      %{"id" => "tata", "key" => "Apero?"},
      %{"id" => "kbrw", "key" => "Oh yeah"}
    ]

    Enum.map(orders, &Server.Database.create(kv_db, &1["id"], &1))
    {:ok, orders} = Server.Database.search(kv_db, [{"key", "42"}])

    assert orders == [%{"id" => "test", "key" => "42"}]

    {:ok, orders} = Server.Database.search(kv_db, [{"key", "42"}, {"key", 42}])
    assert orders == [%{"id" => "test", "key" => "42"}, %{"id" => "toto", "key" => 42}]

    {:ok, orders} = Server.Database.search(kv_db, [{"id", "52"}, {"id", "ThisIsATest"}])
    assert orders == []
  end
end
