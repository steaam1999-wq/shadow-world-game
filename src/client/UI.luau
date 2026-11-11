-- Маленькая библиотека для сборки интерфейса из кода.

local UI = {}

UI.Theme = {
	Background = Color3.fromRGB(24, 20, 38),
	Panel = Color3.fromRGB(38, 32, 60),
	Accent = Color3.fromRGB(140, 90, 255),
	Disabled = Color3.fromRGB(70, 64, 90),
	Text = Color3.fromRGB(240, 235, 255),
	Muted = Color3.fromRGB(165, 155, 195),
	Good = Color3.fromRGB(90, 210, 140),
	Bad = Color3.fromRGB(235, 85, 110),
	Gold = Color3.fromRGB(255, 205, 90),
}

local Theme = UI.Theme

-- Создаёт объект: UI.new("Frame", { Size = ..., Parent = ... }, { дочерние })
function UI.new(className: string, props, children)
	local instance = Instance.new(className)
	for key, value in props or {} do
		if key ~= "Parent" then
			instance[key] = value
		end
	end
	for _, child in children or {} do
		child.Parent = instance
	end
	if props and props.Parent then
		instance.Parent = props.Parent
	end
	return instance
end

function UI.corner(radius: number?)
	return UI.new("UICorner", { CornerRadius = UDim.new(0, radius or 10) })
end

function UI.stroke(color: Color3?, thickness: number?)
	return UI.new("UIStroke", {
		Color = color or Theme.Accent,
		Thickness = thickness or 1.5,
		Transparency = 0.4,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function UI.label(props)
	local defaults = {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		TextColor3 = Theme.Text,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextWrapped = true,
	}
	for key, value in props do
		defaults[key] = value
	end
	return UI.new("TextLabel", defaults)
end

function UI.button(props)
	local defaults = {
		BackgroundColor3 = Theme.Accent,
		Font = Enum.Font.GothamBold,
		TextColor3 = Theme.Text,
		TextSize = 18,
		AutoButtonColor = true,
	}
	for key, value in props do
		defaults[key] = value
	end
	return UI.new("TextButton", defaults, { UI.corner(10) })
end

function UI.setButton(button: TextButton, text: string, enabled: boolean, color: Color3?)
	button.Text = text
	button.BackgroundColor3 = if enabled then (color or Theme.Accent) else Theme.Disabled
	button.AutoButtonColor = enabled
end

-- Карточка-строка внутри списка
function UI.row(parent: Instance, height: number, order: number)
	return UI.new("Frame", {
		Size = UDim2.new(1, -6, 0, height),
		BackgroundColor3 = Theme.Panel,
		LayoutOrder = order,
		Parent = parent,
	}, { UI.corner(10) })
end

-- Заголовок секции внутри списка
function UI.header(parent: Instance, text: string, order: number)
	return UI.label({
		Size = UDim2.new(1, -6, 0, 26),
		Text = text,
		TextColor3 = Theme.Gold,
		TextSize = 18,
		LayoutOrder = order,
		Parent = parent,
	})
end

return UI
