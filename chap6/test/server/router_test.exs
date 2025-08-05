defmodule Server.TheFirstPlugTest do
  use ExUnit.Case
  use Plug.Test

  alias Server.TheFirstPlug

  @opts TheFirstPlug.init([])

  describe "GET /" do
    test "returns welcome message" do
      conn = conn(:get, "/")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.state == :sent
      assert conn.status == 200
      assert conn.resp_body == "Welcome"
    end
  end

  describe "GET /health" do
    test "returns health status" do
      conn = conn(:get, "/health")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.state == :sent
      assert conn.status == 200

      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["status"] == "ok"
    end
  end

  describe "POST /orders" do
    test "creates order with valid data" do
      order_data = %{"id" => "order-123", "name" => "Test Order"}

      conn =
        conn(:post, "/orders", Poison.encode!(order_data))
        |> put_req_header("content-type", "application/json")

      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 201
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["message"] == "Item created successfully"
      assert response["id"] == "order-123"
    end

    test "returns 400 for invalid ID" do
      order_data = %{"id" => 123, "name" => "Test Order"}

      conn =
        conn(:post, "/orders", Poison.encode!(order_data))
        |> put_req_header("content-type", "application/json")

      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 400
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["error"] == "Invalid ID format"
    end

    test "returns 400 for malformed JSON" do
      conn =
        conn(:post, "/orders", "invalid json")
        |> put_req_header("content-type", "application/json")

      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 400
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["error"] == "Bad Request"
    end
  end

  describe "GET /order/:id" do
    test "returns order when exists" do
      order_id = "order-123"

      conn = conn(:get, "/order/#{order_id}")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 200
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["id"] == order_id
      assert response["name"] == "Updated Order"
    end

    test "returns 404 when order does not exist" do
      order_id = "non-existent-order"

      conn = conn(:get, "/order/#{order_id}")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 404
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["error"] == "Item not found"
      assert response["id"] == order_id
    end
  end

  describe "PUT /order/:id" do
    test "updates existing order" do
      order_id = "order-123"
      update_data = %{"id" => order_id, "name" => "Updated Order"}

      conn =
        conn(:put, "/order/#{order_id}", Poison.encode!(update_data))
        |> put_req_header("content-type", "application/json")

      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 200
    end

    test "returns 400 when ID mismatch" do
      order_id = "order-1"
      update_data = %{"id" => "different-id", "name" => "Updated Order"}

      conn =
        conn(:put, "/order/#{order_id}", Poison.encode!(update_data))
        |> put_req_header("content-type", "application/json")

      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 400
    end
  end

  describe "DELETE /order/:id" do
    test "deletes existing order" do
      order_id = "order-to-delete"

      conn = conn(:delete, "/order/#{order_id}")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 404
    end
  end

  describe "GET /search" do
    test "searches with query parameters" do
      conn = conn(:get, "/search?name=test&status=active")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 200
    end
  end

  describe "GET /orders" do
    test "returns all orders" do
      conn = conn(:get, "/orders")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 200
      {:ok, response} = Poison.decode(conn.resp_body)
      assert Map.has_key?(response, "items")
      assert is_list(response["items"])
    end
  end

  describe "404 handling" do
    test "returns 404 for unknown routes" do
      conn = conn(:get, "/unknown-route")
      conn = TheFirstPlug.call(conn, @opts)

      assert conn.status == 404
      {:ok, response} = Poison.decode(conn.resp_body)
      assert response["error"] == "Page not found"
    end
  end
end
