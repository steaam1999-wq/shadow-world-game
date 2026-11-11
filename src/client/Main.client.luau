-- Интерфейс игрока: верхняя панель, меню, окна и уведомления.
-- Клиент только показывает данные и отправляет запросы — всё проверяет сервер.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))
local UI = require(script.Parent:WaitForChild("UI"))
local Theme = UI.Theme

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local ActionRemote = Remotes:WaitForChild("Action")
local DataChanged = Remotes:WaitForChild("DataChanged")
local NotifyRemote = Remotes:WaitForChild("Notify")

local state = nil -- последний снимок данных с сервера

local function serverNow(): number
	return workspace:GetServerTimeNow()
end

local function sendAction(name: string, arg)
	ActionRemote:FireServer(name, arg)
end

---------------------------------------------------------------------
-- Основа интерфейса
---------------------------------------------------------------------

local gui = UI.new("ScreenGui", {
	Name = "ShadowHUD",
	ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = player:WaitForChild("PlayerGui"),
})

-- Верхняя панель с эссенцией
local topBar = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 8),
	Size = UDim2.fromOffset(400, 64),
	BackgroundColor3 = Theme.Background,
	BackgroundTransparency = 0.1,
	Parent = gui,
}, { UI.corner(14), UI.stroke() })

local essenceLabel = UI.label({
	Position = UDim2.fromOffset(16, 6),
	Size = UDim2.new(1, -32, 0, 30),
	TextSize = 26,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "🌑 0",
	Parent = topBar,
})

local infoLabel = UI.label({
	Position = UDim2.fromOffset(16, 36),
	Size = UDim2.new(1, -32, 0, 22),
	TextSize = 15,
	TextColor3 = Theme.Muted,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "",
	Parent = topBar,
})

-- Меню слева
local menu = UI.new("Frame", {
	AnchorPoint = Vector2.new(0, 0.5),
	Position = UDim2.new(0, 10, 0.5, 0),
	Size = UDim2.fromOffset(170, 300),
	BackgroundTransparency = 1,
	Parent = gui,
}, {
	UI.new("UIListLayout", {
		Padding = UDim.new(0, 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
})

-- Окно для панелей
local window = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.55),
	Size = UDim2.fromScale(0.9, 0.7),
	BackgroundColor3 = Theme.Background,
	Visible = false,
	Parent = gui,
}, {
	UI.corner(14),
	UI.stroke(),
	UI.new("UISizeConstraint", { MaxSize = Vector2.new(500, 440) }),
})

local windowTitle = UI.label({
	Position = UDim2.fromOffset(16, 10),
	Size = UDim2.new(1, -70, 0, 36),
	TextSize = 24,
	Parent = window,
})

local closeButton = UI.button({
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -10, 0, 10),
	Size = UDim2.fromOffset(36, 36),
	Text = "✕",
	BackgroundColor3 = Theme.Bad,
	Parent = window,
})

local content = UI.new("ScrollingFrame", {
	Position = UDim2.fromOffset(12, 56),
	Size = UDim2.new(1, -18, 1, -66),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	CanvasSize = UDim2.new(),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollBarThickness = 6,
	ScrollBarImageColor3 = Theme.Accent,
	Parent = window,
}, {
	UI.new("UIListLayout", {
		Padding = UDim.new(0, 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}),
})

-- Уведомления снизу
local toasts = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -110),
	Size = UDim2.fromOffset(420, 200),
	BackgroundTransparency = 1,
	Parent = gui,
}, {
	UI.new("UIListLayout", {
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
		VerticalAlignment = Enum.VerticalAlignment.Bottom,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
	}),
})

local toastCounter = 0
local TOAST_COLORS = { good = Theme.Good, bad = Theme.Bad, info = Theme.Accent }

local function showToast(text: string, kind: string?)
	toastCounter += 1
	local toast = UI.label({
		Size = UDim2.new(1, 0, 0, 36),
		BackgroundColor3 = Theme.Background,
		BackgroundTransparency = 0.1,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextSize = 17,
		Text = text,
		LayoutOrder = toastCounter,
		Parent = toasts,
	})
	UI.corner(10).Parent = toast
	UI.stroke(TOAST_COLORS[kind or "info"] or Theme.Accent, 2).Parent = toast

	task.delay(3, function()
		local fade = TweenService:Create(toast, TweenInfo.new(0.4), {
			BackgroundTransparency = 1,
			TextTransparency = 1,
		})
		fade:Play()
		fade.Completed:Wait()
		toast:Destroy()
	end)
end

-- Всплывающее «+X» под счётчиком
local function popGain(amount: number)
	local label = UI.label({
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, math.random(-60, 60), 0, 76),
		Size = UDim2.fromOffset(160, 28),
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = Theme.Gold,
		TextStrokeTransparency = 0.4,
		TextSize = 22,
		Text = "+" .. Format.Number(amount),
		Parent = gui,
	})
	local tween = TweenService:Create(label, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
		Position = label.Position - UDim2.fromOffset(0, 30),
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	})
	tween:Play()
	tween.Completed:Once(function()
		label:Destroy()
	end)
end

---------------------------------------------------------------------
-- Панели. build(content) строит строки и возвращает update(state).
---------------------------------------------------------------------

local Panels = {}

Panels.upgrades = {
	title = "⚡ Улучшения",
	build = function(parent)
		local rows = {}
		for order, id in Config.UpgradeOrder do
			local def = Config.Upgrades[id]
			local row = UI.row(parent, 72, order)
			local title = UI.label({
				Position = UDim2.fromOffset(14, 10),
				Size = UDim2.new(1, -180, 0, 24),
				Text = def.name,
				Parent = row,
			})
			UI.label({
				Position = UDim2.fromOffset(14, 36),
				Size = UDim2.new(1, -180, 0, 24),
				Text = def.description,
				TextSize = 14,
				TextColor3 = Theme.Muted,
				Font = Enum.Font.Gotham,
				Parent = row,
			})
			local button = UI.button({
				AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -12, 0.5, 0),
				Size = UDim2.fromOffset(150, 44),
				Parent = row,
			})
			button.Activated:Connect(function()
				sendAction("buyUpgrade", id)
			end)
			rows[id] = { title = title, button = button }
		end

		return function(s)
			for id, row in rows do
				local def = Config.Upgrades[id]
				local level = s.upgrades[id]
				row.title.Text = string.format("%s  •  ур. %d", def.name, level)
				if level >= def.maxLevel then
					UI.setButton(row.button, "МАКС", false)
				else
					local cost = Config.UpgradeCost(id, level)
					UI.setButton(row.button, "🌑 " .. Format.Number(cost), s.essence >= cost)
				end
			end
		end
	end,
}

Panels.zones = {
	title = "🗺 Зоны",
	build = function(parent)
		local rows = {}
		for index, zone in Config.Zones do
			local row = UI.row(parent, 72, index)
			UI.label({
				Position = UDim2.fromOffset(14, 10),
				Size = UDim2.new(1, -180, 0, 24),
				Text = zone.name,
				TextColor3 = zone.glowColor,
				Parent = row,
			})
			UI.label({
				Position = UDim2.fromOffset(14, 36),
				Size = UDim2.new(1, -180, 0, 24),
				Text = string.format("Тень: %s ОЗ • награда %s", Format.Number(zone.shadowHp), Format.Number(zone.shadowValue)),
				TextSize = 14,
				TextColor3 = Theme.Muted,
				Font = Enum.Font.Gotham,
				Parent = row,
			})
			local button = UI.button({
				AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -12, 0.5, 0),
				Size = UDim2.fromOffset(150, 44),
				Parent = row,
			})
			button.Activated:Connect(function()
				if not state then
					return
				end
				if index <= state.unlockedZone then
					sendAction("teleport", index)
				elseif index == state.unlockedZone + 1 then
					sendAction("buyZone")
				end
			end)
			rows[index] = button
		end

		return function(s)
			for index, button in rows do
				local zone = Config.Zones[index]
				if index <= s.unlockedZone then
					UI.setButton(button, "Телепорт", true, Theme.Good)
				elseif index == s.unlockedZone + 1 then
					UI.setButton(button, "🔓 " .. Format.Number(zone.price), s.essence >= zone.price)
				else
					UI.setButton(button, "🔒", false)
				end
			end
		end
	end,
}

Panels.rebirth = {
	title = "♻ Перерождение",
	build = function(parent)
		local row = UI.row(parent, 230, 1)
		local text = UI.label({
			Position = UDim2.fromOffset(16, 12),
			Size = UDim2.new(1, -32, 0, 140),
			TextYAlignment = Enum.TextYAlignment.Top,
			TextSize = 17,
			RichText = true,
			Parent = row,
		})
		local button = UI.button({
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -14),
			Size = UDim2.new(1, -32, 0, 50),
			TextSize = 20,
			Parent = row,
		})

		-- Защита от случайного нажатия: подтверждение вторым кликом.
		local confirmUntil = 0
		local update

		button.Activated:Connect(function()
			if os.clock() < confirmUntil then
				confirmUntil = 0
				sendAction("rebirth")
			else
				confirmUntil = os.clock() + 3
				button.Text = "Точно? Нажмите ещё раз"
				task.delay(3, function()
					if state and update then
						update(state)
					end
				end)
			end
		end)

		update = function(s)
			local cost = Config.RebirthCost(s.rebirths)
			text.Text = string.format(
				"Перерождений: <b>%d</b>\nМножитель: <b>%s → %s</b>\n\n"
					.. "<font color=\"#a59bc3\">Сбросит эссенцию, улучшения и зоны, "
					.. "но навсегда увеличит доход.</font>",
				s.rebirths,
				Format.Multiplier(Config.RebirthMultiplier(s.rebirths)),
				Format.Multiplier(Config.RebirthMultiplier(s.rebirths + 1))
			)
			if os.clock() >= confirmUntil then
				UI.setButton(button, "Переродиться • 🌑 " .. Format.Number(cost), s.essence >= cost, Theme.Gold)
			end
		end
		return update
	end,
}

-- Кэш настоящих цен из Roblox
local priceCache = {}
local function fetchPrice(id: number, infoType: Enum.InfoType, onReady)
	if priceCache[id] then
		onReady(priceCache[id])
		return
	end
	task.spawn(function()
		local ok, info = pcall(function()
			return MarketplaceService:GetProductInfo(id, infoType)
		end)
		if ok and info and info.PriceInRobux then
			priceCache[id] = info.PriceInRobux
			onReady(info.PriceInRobux)
		end
	end)
end

Panels.shop = {
	title = "💎 Магазин",
	build = function(parent)
		local passRows = {}
		local order = 0
		local function nextOrder()
			order += 1
			return order
		end

		UI.header(parent, "Навсегда", nextOrder())
		for _, key in Config.GamePassOrder do
			local def = Config.GamePasses[key]
			local row = UI.row(parent, 72, nextOrder())
			UI.label({ Position = UDim2.fromOffset(14, 10), Size = UDim2.new(1, -170, 0, 24), Text = def.name, Parent = row })
			UI.label({
				Position = UDim2.fromOffset(14, 36),
				Size = UDim2.new(1, -170, 0, 24),
				Text = def.description,
				TextSize = 14,
				TextColor3 = Theme.Muted,
				Font = Enum.Font.Gotham,
				Parent = row,
			})
			local button = UI.button({
				AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -12, 0.5, 0),
				Size = UDim2.fromOffset(140, 44),
				Parent = row,
			})
			local entry = { button = button, price = def.price }
			passRows[key] = entry
			if def.id ~= 0 then
				fetchPrice(def.id, Enum.InfoType.GamePass, function(price)
					entry.price = price
					if state and Panels.shop.update then
						Panels.shop.update(state)
					end
				end)
			end
			button.Activated:Connect(function()
				if def.id == 0 then
					warn("Укажите ID Game Pass «" .. key .. "» в Config.GamePasses")
					return
				end
				if state and not state.passes[key] then
					MarketplaceService:PromptGamePassPurchase(player, def.id)
				end
			end)
		end

		UI.header(parent, "Разовые покупки", nextOrder())
		local productRows = {}
		for _, key in Config.ProductOrder do
			local def = Config.Products[key]
			local row = UI.row(parent, 72, nextOrder())
			UI.label({ Position = UDim2.fromOffset(14, 10), Size = UDim2.new(1, -170, 0, 24), Text = def.name, Parent = row })
			local desc = UI.label({
				Position = UDim2.fromOffset(14, 36),
				Size = UDim2.new(1, -170, 0, 24),
				TextSize = 14,
				TextColor3 = Theme.Muted,
				Font = Enum.Font.Gotham,
				Parent = row,
			})
			local button = UI.button({
				AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -12, 0.5, 0),
				Size = UDim2.fromOffset(140, 44),
				Parent = row,
			})
			local entry = { button = button, desc = desc, price = def.price, def = def }
			productRows[key] = entry
			if def.id ~= 0 then
				fetchPrice(def.id, Enum.InfoType.Product, function(price)
					entry.price = price
					if state and Panels.shop.update then
						Panels.shop.update(state)
					end
				end)
			end
			button.Activated:Connect(function()
				if def.id == 0 then
					warn("Укажите ID Developer Product «" .. key .. "» в Config.Products")
					return
				end
				MarketplaceService:PromptProductPurchase(player, def.id)
			end)
		end

		return function(s)
			for key, entry in passRows do
				local def = Config.GamePasses[key]
				if s.passes[key] then
					UI.setButton(entry.button, "✓ Куплено", false)
				elseif def.id == 0 then
					UI.setButton(entry.button, "Не настроено", false)
				else
					UI.setButton(entry.button, "R$ " .. entry.price, true, Theme.Good)
				end
			end
			for _, entry in productRows do
				local def = entry.def
				if def.kind == "essence" then
					entry.desc.Text = "+" .. Format.Number(Config.EssencePackAmount(def, s.unlockedZone, s.rebirths)) .. " эссенции"
				else
					entry.desc.Text = "Удваивает эссенцию, время складывается"
				end
				if def.id == 0 then
					UI.setButton(entry.button, "Не настроено", false)
				else
					UI.setButton(entry.button, "R$ " .. entry.price, true, Theme.Good)
				end
			end
		end
	end,
}

Panels.daily = {
	title = "🎁 Ежедневная награда",
	build = function(parent)
		local row = UI.row(parent, 200, 1)
		local text = UI.label({
			Position = UDim2.fromOffset(16, 12),
			Size = UDim2.new(1, -32, 0, 110),
			TextYAlignment = Enum.TextYAlignment.Top,
			TextSize = 17,
			RichText = true,
			Parent = row,
		})
		local button = UI.button({
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -14),
			Size = UDim2.new(1, -32, 0, 50),
			TextSize = 20,
			Parent = row,
		})
		button.Activated:Connect(function()
			sendAction("claimDaily")
		end)

		return function(s)
			local now = serverNow()
			local streak = Config.NextDailyStreak(s.lastDaily, s.dailyStreak, now)
			local reward = Config.DailyReward(streak, s.unlockedZone, s.rebirths)
			local remaining = Config.Daily.cooldown - (now - s.lastDaily)
			text.Text = string.format(
				"Серия: <b>%d / %d</b> дней\nНаграда: <b>🌑 %s</b>\n\n"
					.. "<font color=\"#a59bc3\">Заходите каждый день — награда растёт. "
					.. "Пропуск больше 2 дней сбросит серию.</font>",
				s.dailyStreak,
				Config.Daily.maxStreak,
				Format.Number(reward)
			)
			if s.lastDaily == 0 or remaining <= 0 then
				UI.setButton(button, "Забрать!", true, Theme.Good)
			else
				UI.setButton(button, "Через " .. Format.Duration(remaining), false)
			end
		end
	end,
}

---------------------------------------------------------------------
-- Открытие / закрытие панелей
---------------------------------------------------------------------

local openPanel = nil

local function clearContent()
	for _, child in content:GetChildren() do
		if not child:IsA("UIListLayout") then
			child:Destroy()
		end
	end
end

local function closePanel()
	window.Visible = false
	if openPanel then
		openPanel.update = nil
	end
	openPanel = nil
	clearContent()
end

local function togglePanel(name: string)
	local panel = Panels[name]
	if openPanel == panel then
		closePanel()
		return
	end
	closePanel()
	openPanel = panel
	windowTitle.Text = panel.title
	panel.update = panel.build(content)
	content.CanvasPosition = Vector2.zero
	window.Visible = true
	if state then
		panel.update(state)
	end
end

closeButton.Activated:Connect(closePanel)

local MENU = {
	{ "⚡ Улучшения", "upgrades" },
	{ "🗺 Зоны", "zones" },
	{ "♻ Перерождение", "rebirth" },
	{ "💎 Магазин", "shop" },
	{ "🎁 Награда", "daily" },
}
for order, item in MENU do
	local button = UI.button({
		Size = UDim2.new(1, 0, 0, 48),
		Text = item[1],
		LayoutOrder = order,
		BackgroundColor3 = Theme.Background,
		Parent = menu,
	})
	UI.stroke().Parent = button
	button.Activated:Connect(function()
		togglePanel(item[2])
	end)
end

---------------------------------------------------------------------
-- Обновление данных
---------------------------------------------------------------------

local function refreshTopBar()
	if not state then
		return
	end
	essenceLabel.Text = "🌑 " .. Format.Number(state.essence) .. " эссенции"
	local now = serverNow()
	local parts = {
		"Множитель " .. Format.Multiplier(Config.EssenceMultiplier(state, state.passes, now)),
		"Перерождений: " .. state.rebirths,
	}
	if state.boostEndsAt > now then
		table.insert(parts, "⚡ Буст " .. Format.Duration(state.boostEndsAt - now))
	end
	infoLabel.Text = table.concat(parts, "  •  ")
end

local function refresh()
	refreshTopBar()
	if openPanel and openPanel.update and state then
		openPanel.update(state)
	end
end

DataChanged.OnClientEvent:Connect(function(snapshot)
	local previous = state
	state = snapshot
	if previous and snapshot.essence > previous.essence then
		popGain(snapshot.essence - previous.essence)
	end
	refresh()
end)

NotifyRemote.OnClientEvent:Connect(showToast)

-- Таймеры (буст, ежедневная награда) обновляются раз в секунду
task.spawn(function()
	while true do
		task.wait(1)
		refresh()
	end
end)

-- Запрашиваем данные, если первый снимок пришёл раньше, чем скрипт запустился
sendAction("sync")
