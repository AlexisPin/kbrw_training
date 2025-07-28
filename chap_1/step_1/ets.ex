my_table = :ets.new(:table, [])

:ets.insert(my_table, {:key1, "value1"})
:ets.insert(my_table, {:key2, "value2"})

:ets.insert_new(my_table, {:key1, "new_value1"}) # This will not overwrite the existing key
:ets.insert_new(my_table, {:key3, "value3"}) # This will insert

# Fetching values
value1 = :ets.lookup(my_table, :key1)
value2 = :ets.lookup(my_table, :key2)
value3 = :ets.lookup(my_table, :key3)
IO.inspect(value1)
IO.inspect(value2)
IO.inspect(value3)

# Fetching a non-existing key
non_existing = :ets.lookup(my_table, :key4)
IO.inspect(non_existing) # Should print []
