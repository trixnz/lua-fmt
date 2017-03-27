function test() -- dangling Begin FunctionDeclaration
end -- dangling FunctionDeclaration

function test()
-- Function body
end

-- leading FunctionDeclaration
function test() -- dangling Begin FunctionDeclaration
  -- FunctionDeclaration body
end -- dangling FunctionDeclaration
-- trailing End FunctionDeclaration

function test(arg) -- dangling Begin FunctionDeclaration
end -- dangling FunctionDeclaration

function test(arg)
-- Function body
end

-- leading FunctionDeclaration
function test(arg) -- dangling Begin FunctionDeclaration
  -- FunctionDeclaration body
end -- dangling FunctionDeclaration
-- trailing End FunctionDeclaration
