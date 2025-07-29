defmodule Server.TheCreator do
  defmacro __using__(_opts) do
    quote do
      import Plug.Conn
      import Server.TheCreator

      Module.register_attribute(__MODULE__, :routes, accumulate: true)

      @error_code 404
      @error_content "Go away, you are not welcome here"

      @before_compile Server.TheCreator
    end
  end

  defmacro __before_compile__(env) do
    routes = Module.get_attribute(env.module, :routes)

    route_functions =
      Enum.map(routes, fn {method, path, handler} ->
        quote do
          defp match_route(unquote(method), unquote(path)) do
            unquote(handler)()
          end
        end
      end)

    quote do
      unquote_splicing(route_functions)

      defp match_route(_, _) do
        {@error_code, @error_content}
      end

      def init(opts), do: opts

      def call(conn, _opts) do
        method = conn.method |> String.downcase() |> String.to_atom()
        path = conn.request_path

        {status_code, content} = match_route(method, path)
        send_resp(conn, status_code, content)
      end
    end
  end

  defmacro my_get(path, do: block) do
    function_name = generate_function_name(:get, path)

    quote do
      @routes {:get, unquote(path), unquote(function_name)}

      def unquote(function_name)(), do: unquote(block)
    end
  end

  defmacro my_error(opts) do
    code = Keyword.get(opts, :code, 404)
    content = Keyword.get(opts, :content, "Error")

    quote do
      @error_code unquote(code)
      @error_content unquote(content)
    end
  end

  defp generate_function_name(method, path) do
    sanitized_path =
      path
      |> String.replace("/", "")
      |> String.replace(~r/[^a-zA-Z0-9_]/, "_")

    case sanitized_path do
      "" -> :"handle_#{method}_root"
      path -> :"handle_#{method}_#{path}"
    end
  end
end
