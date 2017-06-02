-- Typical case with {quotemark: 'single' }
print("this will be converted to single quotes")

-- But keep original quotemark if the alternative quotemark is in the string.
local filename = "It's Fred's friend's hamster's file"
print("'%s'", filename:gsub("'","'\\''"))
