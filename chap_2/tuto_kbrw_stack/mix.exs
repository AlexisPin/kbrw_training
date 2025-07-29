defmodule TutoKbrwStack.MixProject do
  use Mix.Project

  def project do
    [
      app: :tuto_kbrw_stack,
      version: "0.1.0",
      elixir: "~> 1.17",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {TutoKBRWStack, []}
    ]
  end

  defp deps do
    [
      {:poison, "~> 4.0"},
      {:plug_cowboy, "~> 2.4"}
    ]
  end
end
