defmodule HelloPort do
  use GenServer

  def start_link() do
    GenServer.start_link(HelloPort, {"node hello.js", 0, cd: "../node_server"}, name: Hello)
  end

  @impl true
  def init({cmd, init, opts}) do
    port = Port.open({:spawn, ~c"#{cmd}"}, [:binary, :exit_status, packet: 4] ++ opts)
    send(port, {self(), {:command, :erlang.term_to_binary(init)}})
    {:ok, port}
  end

  @impl true
  def handle_info({port, {:exit_status, 0}}, port), do: {:stop, :normal, port}
  def handle_info({port, {:exit_status, _}}, port), do: {:stop, :port_terminated, port}
  def handle_info(_, port), do: {:noreply, port}

  @impl true
  def handle_cast(term, port) do
    send(port, {self(), {:command, :erlang.term_to_binary(term)}})
    {:noreply, port}
  end

  @impl true
  def handle_call(term, _reply_to, port) do
    send(port, {self(), {:command, :erlang.term_to_binary(term)}})

    res =
      receive do
        {^port, {:data, b}} -> :erlang.binary_to_term(b)
      end

    {:reply, res, port}
  end
end
