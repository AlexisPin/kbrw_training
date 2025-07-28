defmodule TutoKBRWStack do
  use Application

  @moduledoc """
  Application
  """

  @impl true
  def start(_type, _args) do
    Server.ServSupervisor.start_link(name: Server.ServSupervisor)
  end
end
