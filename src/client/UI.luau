-- Маленькая библиотека для сборки интерфейса из кода.

local UI = {}

UI.Theme = {
	Background = Color3.fromRGB(20, 16, 34),
	Panel = Color3.fromRGB(36, 29, 61),
	Panel2 = Color3.fromRGB(46, 38, 80),
	Accent = Color3.fromRGB(140, 90, 255),
	Disabled = Color3.fromRGB(61, 54, 84),
	Text = Color3.fromRGB(243, 239, 255),
	Muted = Color3.fromRGB(165, 155, 195),
	Good = Color3.fromRGB(79, 214, 138),
	Bad = Color3.fromRGB(239, 84, 112),
	Gold = Color3.fromRGB(255, 201, 77),
	Gem = Color3.fromRGB(95, 227, 255),
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

function UI.stroke(color: Color3?, thickness: number?, transparency: number?)
	return UI.new("UIStroke", {
		Color = color or Theme.Accent,
		Thickness = thickness or 1.5,
		Transparency = transparency or 0.4,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function UI.gradient(top: Color3, bottom: Color3)
	return UI.new("UIGradient", {
		Color = ColorSequence.new(top, bottom),
		Rotation = 90,
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
		Font = Enum.Font.GothamBlack,
		TextColor3 = Theme.Text,
		TextSize = 17,
		AutoButtonColor = true,
	}
	for key, value in props do
		defaults[key] = value
	end
	return UI.new("TextButton", defaults, { UI.corner(10) })
end

local DARK_TEXT = {
	[Theme.Good] = Color3.fromRGB(13, 42, 26),
	[Theme.Gold] = Color3.fromRGB(58, 40, 0),
	[Theme.Gem] = Color3.fromRGB(6, 42, 51),
}

-- Меняет текст и вид кнопки. Не трогает объект, если ничего не изменилось.
function UI.setButton(button: TextButton, text: string, enabled: boolean, color: Color3?)
	if button.Text ~= text then
		button.Text = text
	end
	local background = if enabled then (color or Theme.Accent) else Theme.Disabled
	button.BackgroundColor3 = background
	button.TextColor3 = if enabled then (DARK_TEXT[background] or Theme.Text) else Theme.Muted
	button.AutoButtonColor = enabled
end

-- Карточка-строка внутри списка
function UI.row(parent: Instance, height: number, order: number)
	return UI.new("Frame", {
		Size = UDim2.new(1, -6, 0, height),
		BackgroundColor3 = Theme.Panel,
		LayoutOrder = order,
		Parent = parent,
	}, { UI.corner(12) })
end

-- Заголовок секции внутри списка
function UI.header(parent: Instance, text: string, order: number)
	return UI.label({
		Size = UDim2.new(1, -6, 0, 26),
		Text = text,
		TextColor3 = Theme.Gold,
		Font = Enum.Font.GothamBlack,
		TextSize = 18,
		LayoutOrder = order,
		Parent = parent,
	})
end

-- Пояснение мелким шрифтом
function UI.note(parent: Instance, text: string, order: number)
	return UI.label({
		Size = UDim2.new(1, -6, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		Text = text,
		TextColor3 = Theme.Muted,
		Font = Enum.Font.Gotham,
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Center,
		RichText = true,
		LayoutOrder = order,
		Parent = parent,
	})
end

-- Полоска прогресса. Возвращает рамку и заливку (меняйте fill.Size).
function UI.bar(props, color: Color3?)
	local back = UI.new("Frame", {
		BackgroundColor3 = Color3.fromRGB(23, 18, 42),
		BorderSizePixel = 0,
	}, { UI.corner(4) })
	for key, value in props do
		if key ~= "Parent" then
			back[key] = value
		end
	end
	local fill = UI.new("Frame", {
		Size = UDim2.fromScale(0, 1),
		BackgroundColor3 = color or Theme.Accent,
		BorderSizePixel = 0,
		Parent = back,
	}, { UI.corner(4) })
	back.Parent = props.Parent
	return back, fill
end

return UI
