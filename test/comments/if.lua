if 1 then -- dangling IfClause
elseif 1 then -- dangling ElseIfClause
else -- dangling ElseClause
end -- dangling IfStatement

-- leading IfClause
if 1 then
-- leading ElseIfClause
elseif 1 then
-- leading ElseClause
else
-- trailing ElseClause
end

-- leading IfStatement
if 1 --[[if 1]] then -- dangling IfClause
-- leading ElseIfClause
elseif 1 --[[elseif 1]] then -- dangling ElseIfClause
-- leading ElseClause
else -- dangling ElseClause
  -- body ElseClause
end -- dangling End IfStatement
-- trailing IfStatement

if 1 then
  -- body IfClause
end
