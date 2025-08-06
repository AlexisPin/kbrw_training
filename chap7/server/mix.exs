defmodule TutoKBRWStack.MixProject do
  use Mix.Project

  def project do
    [
      app: :tuto_kbrw_stack,
      version: "0.1.0",
      elixir: "~> 1.11",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      compilers: [:reaxt_webpack] ++ Mix.compilers()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger, :inets, :ssl],
      mod: {TutoKBRWStack, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:reaxt, tag: "v4.0.2", github: "kbrw/reaxt"},
      {:poison, "~> 4.0.0"},
      {:plug_cowboy, "~> 2.4"}
    ]
  end
end
