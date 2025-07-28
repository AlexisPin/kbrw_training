defmodule MyGenericServer do
  def loop({callback, state}) do
    receive do
      {:cast, msg} ->
        loop({callback, callback.handle_cast(msg, state)})

      {:call, msg, pid} ->
        {result, state} = callback.handle_call(msg, state)
        send(pid, result)
        loop({callback, state})
    end
  end

  def cast(pid, request) do
    send(pid, {:cast, request})
    :ok
  end

  def call(pid, request) do
    send(pid, {:call, request, self()})

    receive do
      msg -> msg
    end
  end

  def start_link(callback, initial_state) do
    server_pid = spawn_link(fn -> loop({callback, initial_state}) end)
    {:ok, server_pid}
  end
end

defmodule AccountServer do
  def handle_cast({:credit, c}, amount), do: amount + c
  def handle_cast({:debit, c}, amount), do: amount - c

  def handle_call(:get, amount) do
    # Return the response of the call, and the new inner state of the server
    {amount, amount}
  end

  def start_link(initial_amount) do
    MyGenericServer.start_link(AccountServer, initial_amount)
  end
end

{:ok, my_account} = AccountServer.start_link(4)
MyGenericServer.cast(my_account, {:credit, 5})
MyGenericServer.cast(my_account, {:credit, 2})
MyGenericServer.cast(my_account, {:debit, 3})
amount = MyGenericServer.call(my_account, :get)
IO.puts("current credit hold is #{amount}")
