-- Интерфейс игрока: верхняя панель, меню, окна-панели, уведомления.
-- Клиент только показывает данные и отправляет запросы — всё проверяет сервер.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))
local UI = require(script.Parent:WaitForChild("UI"))
local Fx = require(script.Parent:WaitForChild("Fx"))
local Theme = UI.Theme

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local ActionRemote = Remotes:WaitForChild("Action")
local DataChanged = Remotes:WaitForChild("DataChanged")
local NotifyRemote = Remotes:WaitForChild("Notify")
local FxRemote = Remotes:WaitForChild("Fx")

local state = nil -- последний снимок данных с сервера
local buyMode = 1 -- 1, 10 или 0 (максимум)
local deleteMode = false
local combo, comboTime = 0, 0

local function serverNow(): number
	return workspace:GetServerTimeNow()
end

local function sendAction(name: string, arg1, arg2)
	ActionRemote:FireServer(name, arg1, arg2)
end

local function percent(value: number): string
	return string.format("+%d%%", math.round(value * 100))
end

local function currentZone(): number
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if not root then
		return 1
	end
	local world = Config.World
	local index = math.floor((root.Position.X + world.ZoneSize / 2) / (world.ZoneSize + world.ZoneGap)) + 1
	return math.clamp(index, 1, #Config.Zones)
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
Fx.Init(gui)
Fx.CurrentZone = currentZone
Fx.OnCombo = function(value: number)
	combo = value
	comboTime = os.clock()
end

-- Верхняя панель
local topBar = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 8),
	Size = UDim2.fromOffset(460, 78),
	BackgroundColor3 = Theme.Background,
	BackgroundTransparency = 0.05,
	Parent = gui,
}, { UI.corner(16), UI.stroke(), UI.gradient(Color3.fromRGB(255, 255, 255), Color3.fromRGB(170, 160, 200)) })

local levelBadge = UI.new("Frame", {
	Position = UDim2.fromOffset(10, 11),
	Size = UDim2.fromOffset(56, 56),
	BackgroundColor3 = Theme.Panel2,
	Parent = topBar,
}, { UI.new("UICorner", { CornerRadius = UDim.new(1, 0) }), UI.stroke(Theme.Accent, 2.5, 0) })

local levelLabel = UI.label({
	Size = UDim2.fromScale(1, 1),
	RichText = true,
	TextSize = 22,
	Font = Enum.Font.GothamBlack,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "1",
	Parent = levelBadge,
})

local essenceLabel = UI.label({
	Position = UDim2.fromOffset(76, 6),
	Size = UDim2.new(1, -180, 0, 34),
	TextSize = 30,
	Font = Enum.Font.GothamBlack,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "🌑 0",
	Parent = topBar,
})
local essenceScale = UI.new("UIScale", { Scale = 1, Parent = essenceLabel })

local infoLabel = UI.label({
	Position = UDim2.fromOffset(76, 40),
	Size = UDim2.new(1, -180, 0, 18),
	TextSize = 13,
	TextColor3 = Theme.Muted,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "",
	Parent = topBar,
})

local _, xpFill = UI.bar({
	Position = UDim2.new(0, 76, 1, -13),
	Size = UDim2.new(1, -180, 0, 5),
	Parent = topBar,
}, Theme.Accent)

local gemsLabel = UI.label({
	AnchorPoint = Vector2.new(1, 0.5),
	Position = UDim2.new(1, -10, 0.5, 0),
	Size = UDim2.fromOffset(88, 36),
	BackgroundTransparency = 0,
	BackgroundColor3 = Theme.Panel,
	TextSize = 17,
	Font = Enum.Font.GothamBlack,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "💎 0",
	Parent = topBar,
})
UI.corner(10).Parent = gemsLabel
UI.stroke(Theme.Gem, 1.5, 0.3).Parent = gemsLabel

-- Плашка зоны и прогресса до Хранителя
local zonePill = UI.label({
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 92),
	Size = UDim2.fromOffset(380, 28),
	BackgroundTransparency = 0.2,
	BackgroundColor3 = Theme.Background,
	TextSize = 14,
	TextXAlignment = Enum.TextXAlignment.Center,
	Text = "",
	Parent = gui,
})
UI.corner(14).Parent = zonePill

-- Полоса здоровья Хранителя
local bossBar = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 126),
	Size = UDim2.fromOffset(420, 50),
	BackgroundColor3 = Color3.fromRGB(30, 8, 16),
	BackgroundTransparency = 0.1,
	Visible = false,
	Parent = gui,
}, { UI.corner(12), UI.stroke(Color3.fromRGB(255, 60, 80), 2, 0) })
local bossTitle = UI.label({
	Position = UDim2.fromOffset(12, 6),
	Size = UDim2.new(1, -90, 0, 20),
	TextSize = 14,
	Font = Enum.Font.GothamBlack,
	TextColor3 = Color3.fromRGB(255, 208, 214),
	Parent = bossBar,
})
local bossTimer = UI.label({
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 6),
	Size = UDim2.fromOffset(70, 20),
	TextSize = 14,
	Font = Enum.Font.GothamBlack,
	TextXAlignment = Enum.TextXAlignment.Right,
	Parent = bossBar,
})
local _, bossFill = UI.bar({
	Position = UDim2.new(0, 12, 1, -16),
	Size = UDim2.new(1, -24, 0, 8),
	Parent = bossBar,
}, Color3.fromRGB(255, 60, 80))

-- Комбо
local comboLabel = UI.label({
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.3),
	Size = UDim2.fromOffset(420, 44),
	TextSize = 32,
	Font = Enum.Font.GothamBlack,
	TextColor3 = Theme.Gold,
	TextStrokeTransparency = 0.2,
	TextXAlignment = Enum.TextXAlignment.Center,
	Visible = false,
	Parent = gui,
})

-- Ежедневный подарок
local giftButton = UI.button({
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 92),
	Size = UDim2.fromOffset(58, 58),
	Text = "🎁",
	TextSize = 32,
	BackgroundColor3 = Theme.Panel,
	Parent = gui,
})
local giftStroke = UI.stroke(Theme.Gold, 2, 0.5)
giftStroke.Parent = giftButton
local giftScale = UI.new("UIScale", { Scale = 1, Parent = giftButton })
local giftDot = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.new(1, -4, 0, 4),
	Size = UDim2.fromOffset(14, 14),
	BackgroundColor3 = Theme.Bad,
	Visible = false,
	Parent = giftButton,
}, { UI.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
giftButton.Activated:Connect(function()
	sendAction("claimDaily")
end)

-- Меню слева
local menu = UI.new("Frame", {
	AnchorPoint = Vector2.new(0, 0.5),
	Position = UDim2.new(0, 10, 0.55, 0),
	Size = UDim2.fromOffset(150, 7 * 50),
	BackgroundTransparency = 1,
	Parent = gui,
}, {
	UI.new("UIListLayout", {
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
		VerticalAlignment = Enum.VerticalAlignment.Center,
	}),
})

-- Окно для панелей
local window = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.56),
	Size = UDim2.fromScale(0.92, 0.72),
	BackgroundColor3 = Theme.Background,
	Visible = false,
	ZIndex = 5,
	Parent = gui,
}, {
	UI.corner(16),
	UI.stroke(Theme.Accent, 2, 0.2),
	UI.new("UISizeConstraint", { MaxSize = Vector2.new(540, 500) }),
})

local windowTitle = UI.label({
	Position = UDim2.fromOffset(16, 10),
	Size = UDim2.new(1, -70, 0, 36),
	TextSize = 24,
	Font = Enum.Font.GothamBlack,
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
	UI.new("UIPadding", { PaddingBottom = UDim.new(0, 10) }),
})

-- Уведомления
local toasts = UI.new("Frame", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -110),
	Size = UDim2.fromOffset(440, 200),
	BackgroundTransparency = 1,
	ZIndex = 60,
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
local TOAST_COLORS = { good = Theme.Good, bad = Theme.Bad, info = Theme.Accent, gold = Theme.Gold, gem = Theme.Gem }

local function showToast(text: string, kind: string?)
	toastCounter += 1
	local toast = UI.label({
		Size = UDim2.new(1, 0, 0, 38),
		BackgroundColor3 = Theme.Background,
		BackgroundTransparency = 0.05,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextSize = 16,
		Text = text,
		LayoutOrder = toastCounter,
		ZIndex = 60,
		Parent = toasts,
	})
	UI.corner(12).Parent = toast
	UI.stroke(TOAST_COLORS[kind or "info"] or Theme.Accent, 2, 0).Parent = toast

	local count = 0
	for _, child in toasts:GetChildren() do
		if child:IsA("TextLabel") then
			count += 1
		end
	end
	if count > 4 then
		for _, child in toasts:GetChildren() do
			if child:IsA("TextLabel") and child ~= toast then
				child:Destroy()
				break
			end
		end
	end

	task.delay(2.6, function()
		local fade = TweenService:Create(toast, TweenInfo.new(0.4), { BackgroundTransparency = 1, TextTransparency = 1 })
		fade:Play()
		fade.Completed:Wait()
		toast:Destroy()
	end)
end
Fx.toast = showToast

---------------------------------------------------------------------
-- Строка списка: иконка, заголовок, описание, кнопка, полоска
---------------------------------------------------------------------

local function itemRow(parent: Instance, order: number, icon: string, height: number?, withBar: boolean?)
	local frame = UI.row(parent, height or 76, order)
	UI.label({
		Position = UDim2.fromOffset(8, 0),
		Size = UDim2.new(0, 42, 1, 0),
		Text = icon,
		TextSize = 28,
		TextXAlignment = Enum.TextXAlignment.Center,
		Parent = frame,
	})
	local title = UI.label({
		Position = UDim2.fromOffset(56, 8),
		Size = UDim2.new(1, -212, 0, 20),
		TextSize = 16,
		Font = Enum.Font.GothamBlack,
		TextWrapped = false,
		TextTruncate = Enum.TextTruncate.AtEnd,
		Parent = frame,
	})
	local desc = UI.label({
		Position = UDim2.fromOffset(56, 29),
		Size = UDim2.new(1, -212, 0, 34),
		TextSize = 13,
		TextColor3 = Theme.Muted,
		Font = Enum.Font.GothamMedium,
		TextYAlignment = Enum.TextYAlignment.Top,
		RichText = true,
		Parent = frame,
	})
	local button = UI.button({
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(140, 44),
		TextSize = 15,
		Parent = frame,
	})
	local fill
	if withBar then
		local _, barFill = UI.bar({
			Position = UDim2.new(0, 56, 1, -11),
			Size = UDim2.new(1, -212, 0, 5),
			Parent = frame,
		})
		fill = barFill
	end
	return { frame = frame, title = title, desc = desc, button = button, fill = fill }
end

local function horizontalRow(parent: Instance, order: number, height: number)
	return UI.new("Frame", {
		Size = UDim2.new(1, -6, 0, height),
		BackgroundTransparency = 1,
		LayoutOrder = order,
		Parent = parent,
	}, {
		UI.new("UIListLayout", {
			FillDirection = Enum.FillDirection.Horizontal,
			Padding = UDim.new(0, 6),
			SortOrder = Enum.SortOrder.LayoutOrder,
		}),
	})
end

-- Карточка с текстом (RichText), растёт по содержимому
local function textCard(parent: Instance, order: number)
	local card = UI.label({
		Size = UDim2.new(1, -6, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 0,
		BackgroundColor3 = Theme.Panel,
		TextSize = 16,
		Font = Enum.Font.GothamMedium,
		TextYAlignment = Enum.TextYAlignment.Top,
		RichText = true,
		LineHeight = 1.25,
		LayoutOrder = order,
		Parent = parent,
	})
	UI.corner(12).Parent = card
	UI.new("UIPadding", {
		PaddingTop = UDim.new(0, 12),
		PaddingBottom = UDim.new(0, 12),
		PaddingLeft = UDim.new(0, 14),
		PaddingRight = UDim.new(0, 14),
		Parent = card,
	})
	return card
end

-- Кэш настоящих цен из Roblox
local priceCache = {}
local function fetchPrice(id: number, infoType: Enum.InfoType)
	if priceCache[id] ~= nil then
		return
	end
	priceCache[id] = false
	task.spawn(function()
		local ok, info = pcall(function()
			return MarketplaceService:GetProductInfo(id, infoType)
		end)
		if ok and info and info.PriceInRobux then
			priceCache[id] = info.PriceInRobux
		end
	end)
end
local function priceOf(def): number
	return if def.id ~= 0 and priceCache[def.id] then priceCache[def.id] else def.price
end

---------------------------------------------------------------------
-- Панели. build(content, state) строит строки и возвращает update(state).
-- sig(state) — если меняется, панель перестраивается целиком.
---------------------------------------------------------------------

local Panels = {}
local refreshPanel -- объявлено ниже

Panels.upgrades = {
	title = "⚡ Прокачка",
	build = function(parent)
		local seg = horizontalRow(parent, 0, 40)
		local modeButtons = {}
		for i, mode in { { 1, "x1" }, { 10, "x10" }, { 0, "МАКС" } } do
			local button = UI.button({ Size = UDim2.new(1 / 3, -4, 1, 0), Text = mode[2], LayoutOrder = i, Parent = seg })
			button.Activated:Connect(function()
				buyMode = mode[1]
				refreshPanel()
			end)
			modeButtons[mode[1]] = { button = button, label = mode[2] }
		end

		local rows = {}
		for order, id in Config.UpgradeOrder do
			local def = Config.Upgrades[id]
			local row = itemRow(parent, order, def.icon, 84, true)
			row.button.Activated:Connect(function()
				sendAction("buyUpgrade", id, buyMode)
			end)
			rows[id] = row
		end

		return function(s)
			for mode, entry in modeButtons do
				UI.setButton(entry.button, entry.label, true, if buyMode == mode then Theme.Gold else Theme.Panel2)
			end
			for id, row in rows do
				local def = Config.Upgrades[id]
				local level = s.upgrades[id]
				row.title.Text = string.format("%s • %d/%d", def.name, level, def.maxLevel)
				row.fill.Size = UDim2.fromScale(level / def.maxLevel, 1)
				if level >= def.maxLevel then
					row.desc.Text = def.description .. "\n<b>" .. Config.UpgradeEffect(id, level) .. "</b>"
					UI.setButton(row.button, "МАКС", false)
				else
					local count, cost = 0, 0
					if buyMode == 0 then
						while level + count < def.maxLevel and cost + Config.UpgradeCost(id, level + count) <= s.essence do
							cost += Config.UpgradeCost(id, level + count)
							count += 1
						end
						if count == 0 then
							count, cost = 1, Config.UpgradeCost(id, level)
						end
					else
						count = math.min(buyMode, def.maxLevel - level)
						for i = 0, count - 1 do
							cost += Config.UpgradeCost(id, level + i)
						end
					end
					row.desc.Text = string.format(
						"%s\n<b>%s</b> → <font color=\"#4fd68a\"><b>%s</b></font>",
						def.description,
						Config.UpgradeEffect(id, level),
						Config.UpgradeEffect(id, level + count)
					)
					local prefix = if count > 1 then "+" .. count .. " • " else ""
					UI.setButton(row.button, prefix .. "🌑 " .. Format.Number(cost), s.essence >= cost)
				end
			end
		end
	end,
}

Panels.pets = {
	title = "🐾 Питомцы",
	sig = function(s)
		return table.concat({
			#s.pets,
			table.concat(s.equipped, ","),
			s.unlockedZone,
			Config.PetSlots(s.passes),
			tostring(deleteMode),
		}, "|")
	end,
	build = function(parent, s)
		local order = 0
		local function nextOrder()
			order += 1
			return order
		end

		-- Слоты и общий бонус
		local card = UI.row(parent, 104, nextOrder())
		local slots = UI.new("Frame", {
			Position = UDim2.fromOffset(0, 10),
			Size = UDim2.new(1, 0, 0, 58),
			BackgroundTransparency = 1,
			Parent = card,
		}, {
			UI.new("UIListLayout", {
				FillDirection = Enum.FillDirection.Horizontal,
				HorizontalAlignment = Enum.HorizontalAlignment.Center,
				Padding = UDim.new(0, 8),
				SortOrder = Enum.SortOrder.LayoutOrder,
			}),
		})
		for i = 1, Config.PetSlots(s.passes) do
			local uid = s.equipped[i]
			local pet = uid and Config.FindPet(s, uid)
			local slot = UI.label({
				Size = UDim2.fromOffset(56, 56),
				BackgroundTransparency = 0,
				BackgroundColor3 = Theme.Background,
				Text = if pet then Config.PetInfo(pet).emoji else "",
				TextSize = 32,
				TextXAlignment = Enum.TextXAlignment.Center,
				LayoutOrder = i,
				Parent = slots,
			})
			UI.corner(12).Parent = slot
			UI.stroke(if pet then Config.Rarities[pet.rarity].color else Theme.Disabled, 2, 0).Parent = slot
		end
		local essence, damage = Config.PetBonus(s)
		UI.label({
			Position = UDim2.new(0, 0, 1, -30),
			Size = UDim2.new(1, 0, 0, 22),
			Text = string.format("Бонус: %s эссенции • %s урона", percent(essence), percent(damage)),
			TextSize = 14,
			TextXAlignment = Enum.TextXAlignment.Center,
			Parent = card,
		})

		local actions = horizontalRow(parent, nextOrder(), 42)
		local best = UI.button({ Size = UDim2.new(0.5, -3, 1, 0), Text = "Надеть лучших", LayoutOrder = 1, Parent = actions })
		UI.setButton(best, "Надеть лучших", true, Theme.Good)
		best.Activated:Connect(function()
			sendAction("equipBest")
		end)
		local del = UI.button({ Size = UDim2.new(0.5, -3, 1, 0), LayoutOrder = 2, Parent = actions })
		UI.setButton(del, if deleteMode then "Готово" else "🗑 Удалять", true, if deleteMode then Theme.Bad else Theme.Panel2)
		del.Activated:Connect(function()
			deleteMode = not deleteMode
			refreshPanel()
		end)

		-- Яйца
		UI.header(parent, "Яйца", nextOrder())
		local eggRows = {}
		for tier = 1, s.unlockedZone do
			local zone = Config.Zones[tier]
			local row = itemRow(parent, nextOrder(), "🥚", 66)
			row.title.Text = "Яйцо: " .. zone.name
			row.desc.Text = "Питомцы T" .. tier .. " — сильнее с каждой зоной"
			row.button.Activated:Connect(function()
				sendAction("openEgg", tier)
			end)
			table.insert(eggRows, { row = row, price = zone.eggPrice, gems = false })
		end
		local gold = itemRow(parent, nextOrder(), "🌟", 66)
		gold.title.Text = "Золотое яйцо"
		gold.desc.Text = string.format("T%d • легендарный 8%% (обычно 2%%)", s.unlockedZone)
		gold.button.Activated:Connect(function()
			sendAction("openEgg", "gold")
		end)
		table.insert(eggRows, { row = gold, price = Config.Pets.goldEggPrice, gems = true })
		UI.note(parent, "Шансы: Обычный 62% • Редкий 27% • Эпический 9% • Легендарный 2%", nextOrder())

		-- Инвентарь
		UI.header(
			parent,
			string.format("Инвентарь %d/%d", #s.pets, Config.Pets.inventory)
				.. (if deleteMode then " — нажмите, чтобы удалить" else ""),
			nextOrder()
		)
		if #s.pets == 0 then
			UI.note(parent, "Пока пусто. Откройте первое яйцо!", nextOrder())
		end
		local grid = UI.new("Frame", {
			Size = UDim2.new(1, -6, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundTransparency = 1,
			LayoutOrder = nextOrder(),
			Parent = parent,
		}, {
			UI.new("UIGridLayout", {
				CellSize = UDim2.fromOffset(86, 94),
				CellPadding = UDim2.fromOffset(8, 8),
				SortOrder = Enum.SortOrder.LayoutOrder,
			}),
		})
		local sorted = table.clone(s.pets)
		table.sort(sorted, function(a, b)
			return Config.PetPower(a) > Config.PetPower(b)
		end)
		for i, pet in sorted do
			local equipped = table.find(s.equipped, pet.uid) ~= nil
			local rarity = Config.Rarities[pet.rarity]
			local petCard = UI.new("TextButton", {
				BackgroundColor3 = Theme.Panel,
				Text = "",
				AutoButtonColor = true,
				LayoutOrder = i,
				Parent = grid,
			}, { UI.corner(12), UI.stroke(rarity.color, 2, 0) })
			UI.label({
				Position = UDim2.fromOffset(6, 3),
				Size = UDim2.fromOffset(40, 14),
				Text = "T" .. pet.tier,
				TextSize = 12,
				TextColor3 = rarity.color,
				Font = Enum.Font.GothamBlack,
				Parent = petCard,
			})
			if equipped then
				UI.label({
					AnchorPoint = Vector2.new(1, 0),
					Position = UDim2.new(1, -5, 0, 2),
					Size = UDim2.fromOffset(18, 18),
					Text = "✓",
					TextSize = 16,
					TextColor3 = Theme.Good,
					Font = Enum.Font.GothamBlack,
					TextXAlignment = Enum.TextXAlignment.Center,
					Parent = petCard,
				})
			end
			UI.label({
				Position = UDim2.fromOffset(0, 16),
				Size = UDim2.new(1, 0, 0, 44),
				Text = Config.PetInfo(pet).emoji,
				TextSize = 36,
				TextXAlignment = Enum.TextXAlignment.Center,
				Parent = petCard,
			})
			local petEssence, petDamage = Config.PetStats(pet)
			UI.label({
				Position = UDim2.new(0, 0, 1, -32),
				Size = UDim2.new(1, 0, 0, 30),
				Text = percent(petEssence) .. (if petDamage > 0 then "\n⚔" .. percent(petDamage) else ""),
				TextSize = 11,
				TextColor3 = Theme.Muted,
				TextXAlignment = Enum.TextXAlignment.Center,
				Parent = petCard,
			})
			petCard.Activated:Connect(function()
				if deleteMode then
					if equipped then
						showToast("Сначала снимите питомца", "bad")
					else
						sendAction("deletePet", pet.uid)
					end
				else
					sendAction("toggleEquip", pet.uid)
				end
			end)
		end

		return function(st)
			local full = #st.pets >= Config.Pets.inventory
			for _, egg in eggRows do
				if egg.gems then
					UI.setButton(egg.row.button, "💎 " .. egg.price, not full and st.gems >= egg.price, Theme.Gem)
				else
					UI.setButton(egg.row.button, "🌑 " .. Format.Number(egg.price), not full and st.essence >= egg.price)
				end
			end
		end
	end,
}

Panels.quests = {
	title = "📜 Задания",
	sig = function(s)
		local parts = {}
		for _, quest in Config.Quests do
			table.insert(parts, s.quests[quest.id] or 0)
		end
		return table.concat(parts, ",")
	end,
	build = function(parent)
		UI.note(parent, "Выполняйте задания и получайте кристаллы 💎 — за них можно купить Золотое яйцо и бусты.", 0)
		local rows = {}
		for order, quest in Config.Quests do
			local row = itemRow(parent, order, quest.icon, 80, true)
			row.button.Activated:Connect(function()
				sendAction("claimQuest", quest.id)
			end)
			rows[quest] = row
		end
		return function(s)
			for quest, row in rows do
				local done = s.quests[quest.id] or 0
				local stage = done + 1
				local goal = quest.goals[stage]
				if not goal then
					row.title.Text = quest.name
					row.desc.Text = "Все этапы выполнены!"
					row.fill.Size = UDim2.fromScale(1, 1)
					UI.setButton(row.button, "✓", false)
				else
					local value = math.min(Config.QuestStat(s, quest.stat), goal)
					row.title.Text = string.format("%s • этап %d/%d", quest.name, stage, #quest.goals)
					row.desc.Text = string.format(quest.text, Format.Number(goal))
						.. string.format(" — <b>%s/%s</b>", Format.Number(value), Format.Number(goal))
					row.fill.Size = UDim2.fromScale(value / goal, 1)
					local ready = value >= goal
					UI.setButton(
						row.button,
						if ready then "Забрать " .. quest.rewards[stage] .. " 💎" else quest.rewards[stage] .. " 💎",
						ready,
						Theme.Gem
					)
				end
			end
		end
	end,
}

local function statLine(label: string, value: string): string
	return string.format("%s  <b>%s</b>", label, value)
end

Panels.profile = {
	title = "👤 Характеристики",
	build = function(parent)
		local levelCard = textCard(parent, 1)
		UI.header(parent, "⚔ Бой", 2)
		local fightCard = textCard(parent, 3)
		UI.header(parent, "💰 Доход", 4)
		local incomeCard = textCard(parent, 5)
		UI.header(parent, "📊 Статистика", 6)
		local statsCard = textCard(parent, 7)

		return function(s)
			local passes = s.passes
			local petEssence, petDamage = Config.PetBonus(s)
			local boostLeft = s.boostEndsAt - serverNow()
			levelCard.Text = string.format(
				"<b><font size=\"20\">⭐ Уровень %d</font></b>\nОпыт: <b>%s / %s</b>\n<font color=\"#a59bc3\">Каждый уровень: +3%% эссенции и +1%% урона</font>",
				s.level,
				Format.Number(s.xp),
				Format.Number(Config.XpNeeded(s.level))
			)
			fightCard.Text = table.concat({
				statLine("🔦 Урон за удар", Format.Number(Config.TapDamage(s))),
				statLine("🎯 Шанс крита", math.round(Config.CritChance(s.upgrades.crit) * 100) .. "%"),
				statLine("💥 Сила крита", string.format("x%.2f", Config.CritMultiplier(s.upgrades.critDamage))),
				statLine("✨ Урон духов в секунду", if Config.SpiritDamage(s) > 0 then Format.Number(Config.SpiritDamage(s)) else "—"),
				statLine("🐾 Урон от питомцев", percent(petDamage)),
				statLine("🍀 Счастливая ловля", string.format("%.1f%%", Config.LuckyChance(s.upgrades.luck) * 100)),
			}, "\n")
			incomeCard.Text = table.concat({
				statLine("Итоговый множитель", "<font color=\"#ffc94d\">" .. Format.Multiplier(Config.EssenceMultiplier(s, passes, serverNow())) .. "</font>"),
				statLine("💰 Жадность", Format.Multiplier(Config.GreedMultiplier(s.upgrades.greed))),
				statLine("♻️ Перерождения", Format.Multiplier(Config.RebirthMultiplier(s.rebirths))),
				statLine("⭐ Уровень", Format.Multiplier(Config.LevelMultiplier(s.level))),
				statLine("🐾 Питомцы", Format.Multiplier(1 + petEssence)),
				statLine("👑 Пропуска", Format.Multiplier((if passes.DoubleEssence then 2 else 1) * (if passes.VIP then 1.5 else 1))),
				statLine("⚡ Буст", if boostLeft > 0 then "x2 • " .. Format.Duration(boostLeft) else "—"),
			}, "\n")
			statsCard.Text = table.concat({
				statLine("Поймано теней", Format.Number(s.stats.kills)),
				statLine("Золотых и счастливых", Format.Number(s.stats.golden)),
				statLine("Хранителей побеждено", Format.Number(s.stats.bosses)),
				statLine("Критов", Format.Number(s.stats.crits)),
				statLine("Открыто яиц", Format.Number(s.stats.eggs)),
				statLine("Всего эссенции", Format.Number(s.totalEssence)),
				statLine("Время в игре", Format.Duration(s.stats.time)),
			}, "\n")
		end
	end,
}

Panels.zones = {
	title = "🗺 Зоны",
	build = function(parent)
		local rows = {}
		for index, zone in Config.Zones do
			local row = itemRow(parent, index, "🌑", 72)
			row.title.Text = zone.name
			row.title.TextColor3 = zone.glowColor
			row.desc.Text = string.format(
				"Тень: %s ОЗ • награда %s\nЯйцо: 🌑 %s",
				Format.Number(zone.shadowHp),
				Format.Number(zone.shadowValue),
				Format.Number(zone.eggPrice)
			)
			row.button.Activated:Connect(function()
				if not state then
					return
				end
				if index <= state.unlockedZone then
					sendAction("teleport", index)
				elseif index == state.unlockedZone + 1 then
					sendAction("buyZone")
				end
			end)
			rows[index] = row.button
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
	title = "♻️ Перерождение",
	build = function(parent)
		local card = textCard(parent, 1)
		local button = UI.button({ Size = UDim2.new(1, -6, 0, 54), TextSize = 19, LayoutOrder = 2, Parent = parent })
		local confirmUntil = 0
		button.Activated:Connect(function()
			if os.clock() < confirmUntil then
				confirmUntil = 0
				sendAction("rebirth")
			else
				confirmUntil = os.clock() + 3
				UI.setButton(button, "Точно? Нажмите ещё раз", true, Theme.Bad)
			end
		end)
		return function(s)
			local cost = Config.RebirthCost(s.rebirths)
			card.Text = string.format(
				"Перерождений: <b>%d</b>\nМножитель: <b>%s</b> → <font color=\"#4fd68a\"><b>%s</b></font>\nНаграда: <b>+%d 💎</b>\n\n"
					.. "<font color=\"#a59bc3\">Сбросятся эссенция, прокачка и зоны.\nСохранятся уровень, питомцы, кристаллы и задания.</font>",
				s.rebirths,
				Format.Multiplier(Config.RebirthMultiplier(s.rebirths)),
				Format.Multiplier(Config.RebirthMultiplier(s.rebirths + 1)),
				Config.Rebirth.gemsPerRebirth * (s.rebirths + 1)
			)
			if os.clock() >= confirmUntil then
				UI.setButton(button, "Переродиться • 🌑 " .. Format.Number(cost), s.essence >= cost, Theme.Gold)
			end
		end
	end,
}

Panels.shop = {
	title = "💎 Магазин",
	sig = function(s)
		local owned = {}
		for key, value in s.passes do
			if value then
				table.insert(owned, key)
			end
		end
		table.sort(owned)
		return table.concat(owned, ",")
	end,
	build = function(parent)
		local order = 0
		local function nextOrder()
			order += 1
			return order
		end

		UI.header(parent, "За кристаллы 💎", nextOrder())
		local boost = itemRow(parent, nextOrder(), "⚡", 66)
		boost.title.Text = "Буст x2 на 5 минут"
		boost.desc.Text = "Удваивает всю эссенцию, время складывается"
		boost.button.Activated:Connect(function()
			sendAction("gemBoost")
		end)

		UI.header(parent, "Навсегда (Game Pass)", nextOrder())
		local passRows = {}
		for _, key in Config.GamePassOrder do
			local def = Config.GamePasses[key]
			local row = itemRow(parent, nextOrder(), def.icon, 66)
			row.title.Text = def.name
			row.desc.Text = def.description
			if def.id ~= 0 then
				fetchPrice(def.id, Enum.InfoType.GamePass)
			end
			row.button.Activated:Connect(function()
				if def.id == 0 then
					warn("Укажите ID Game Pass «" .. key .. "» в Config.GamePasses")
					return
				end
				if state and not state.passes[key] then
					MarketplaceService:PromptGamePassPurchase(player, def.id)
				end
			end)
			passRows[key] = row
		end

		UI.header(parent, "Разовые покупки", nextOrder())
		local productRows = {}
		for _, key in Config.ProductOrder do
			local def = Config.Products[key]
			local row = itemRow(parent, nextOrder(), def.icon, 66)
			row.title.Text = def.name
			if def.id ~= 0 then
				fetchPrice(def.id, Enum.InfoType.Product)
			end
			row.button.Activated:Connect(function()
				if def.id == 0 then
					warn("Укажите ID Developer Product «" .. key .. "» в Config.Products")
					return
				end
				MarketplaceService:PromptProductPurchase(player, def.id)
			end)
			productRows[key] = row
		end

		return function(s)
			UI.setButton(boost.button, "💎 " .. Config.GemBoost.price, s.gems >= Config.GemBoost.price, Theme.Gem)
			for key, row in passRows do
				local def = Config.GamePasses[key]
				if s.passes[key] then
					UI.setButton(row.button, "✓ Есть", false)
				elseif def.id == 0 then
					UI.setButton(row.button, "Не настроено", false)
				else
					UI.setButton(row.button, "R$ " .. priceOf(def), true, Theme.Good)
				end
			end
			for key, row in productRows do
				local def = Config.Products[key]
				if def.kind == "essence" then
					row.desc.Text = "+" .. Format.Number(Config.EssencePackAmount(def, s.unlockedZone, s.rebirths)) .. " эссенции"
				elseif def.kind == "gems" then
					row.desc.Text = "+" .. def.amount .. " 💎"
				else
					row.desc.Text = "x2 эссенция, время складывается"
				end
				if def.id == 0 then
					UI.setButton(row.button, "Не настроено", false)
				else
					UI.setButton(row.button, "R$ " .. priceOf(def), true, Theme.Good)
				end
			end
		end
	end,
}

---------------------------------------------------------------------
-- Открытие / закрытие панелей
---------------------------------------------------------------------

local openPanel = nil
local panelUpdate = nil
local panelSig = nil

local function clearContent()
	for _, child in content:GetChildren() do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

local function renderPanel()
	clearContent()
	panelUpdate = openPanel.build(content, state)
	panelSig = if openPanel.sig then openPanel.sig(state) else nil
	panelUpdate(state)
end

function refreshPanel()
	if not openPanel or not state then
		return
	end
	if openPanel.sig and openPanel.sig(state) ~= panelSig then
		local position = content.CanvasPosition
		renderPanel()
		content.CanvasPosition = position
	elseif panelUpdate then
		panelUpdate(state)
	end
end

local function closePanel()
	window.Visible = false
	openPanel = nil
	panelUpdate = nil
	deleteMode = false
	clearContent()
end

local function togglePanel(name: string)
	if not state then
		return
	end
	local panel = Panels[name]
	if openPanel == panel then
		closePanel()
		return
	end
	closePanel()
	openPanel = panel
	windowTitle.Text = panel.title
	content.CanvasPosition = Vector2.zero
	renderPanel()
	window.Visible = true
end

closeButton.Activated:Connect(closePanel)

local MENU = {
	{ "⚡ Прокачка", "upgrades" },
	{ "🐾 Питомцы", "pets" },
	{ "📜 Задания", "quests" },
	{ "👤 Профиль", "profile" },
	{ "🗺 Зоны", "zones" },
	{ "♻️ Рождение", "rebirth" },
	{ "💎 Магазин", "shop" },
}
local questDot
for order, item in MENU do
	local button = UI.button({
		Size = UDim2.new(1, 0, 0, 44),
		Text = item[1],
		TextSize = 16,
		LayoutOrder = order,
		BackgroundColor3 = Theme.Panel,
		Parent = menu,
	})
	UI.stroke().Parent = button
	button.Activated:Connect(function()
		togglePanel(item[2])
	end)
	if item[2] == "quests" then
		questDot = UI.new("Frame", {
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(1, -4, 0, 4),
			Size = UDim2.fromOffset(14, 14),
			BackgroundColor3 = Theme.Bad,
			Visible = false,
			Parent = button,
		}, { UI.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
	end
end

---------------------------------------------------------------------
-- Обновление HUD
---------------------------------------------------------------------

local function dailyReady(s): boolean
	return s.lastDaily == 0 or serverNow() - s.lastDaily >= Config.Daily.cooldown
end

local function refreshTopBar()
	if not state then
		return
	end
	local s = state
	local now = serverNow()
	essenceLabel.Text = "🌑 " .. Format.Number(s.essence)
	gemsLabel.Text = "💎 " .. Format.Number(s.gems)
	levelLabel.Text = string.format("<font size=\"10\">УР.</font>\n%d", s.level)
	xpFill.Size = UDim2.fromScale(math.clamp(s.xp / Config.XpNeeded(s.level), 0, 1), 1)

	local parts = { Format.Multiplier(Config.EssenceMultiplier(s, s.passes, now)) .. " эссенции" }
	if s.boostEndsAt > now then
		table.insert(parts, "⚡ " .. Format.Duration(s.boostEndsAt - now))
	end
	if s.passes.AutoCatch then
		table.insert(parts, "🤖 авто")
	end
	if s.passes.VIP then
		table.insert(parts, "👑 VIP")
	end
	infoLabel.Text = table.concat(parts, "  •  ")

	local ready = dailyReady(s)
	giftDot.Visible = ready
	giftStroke.Transparency = if ready then 0 else 0.5

	local anyQuest = false
	for _, quest in Config.Quests do
		if Config.QuestReady(s, quest) then
			anyQuest = true
			break
		end
	end
	if questDot then
		questDot.Visible = anyQuest
	end
end

-- Зона, Хранитель и комбо обновляются часто
local function refreshWorldHud()
	local zoneIndex = currentZone()
	local zone = Config.Zones[zoneIndex]
	local shadows = workspace:FindFirstChild("Shadows")
	local kills = if shadows then shadows:GetAttribute("Kills" .. zoneIndex) or 0 else 0

	local boss = nil
	if shadows then
		for _, child in shadows:GetChildren() do
			if child:GetAttribute("IsBoss") and child:GetAttribute("Zone") == zoneIndex then
				boss = child
				break
			end
		end
	end

	if state and zoneIndex > state.unlockedZone then
		zonePill.Text = string.format("🔒 %s — откройте в меню «Зоны»", zone.name)
		zonePill.TextColor3 = Theme.Muted
	elseif boss then
		zonePill.Text = zone.name .. "  •  ⚔ Хранитель здесь!"
		zonePill.TextColor3 = Color3.fromRGB(255, 120, 135)
	else
		zonePill.Text = string.format("%s  •  ⚔ Хранитель %d/%d", zone.name, kills, Config.Boss.kills)
		zonePill.TextColor3 = zone.glowColor
	end

	bossBar.Visible = boss ~= nil
	if boss then
		local hp = boss:GetAttribute("Hp") or 0
		local maxHp = boss:GetAttribute("MaxHp") or 1
		local left = math.max(0, (boss:GetAttribute("EndsAt") or 0) - serverNow())
		bossTitle.Text = string.format("ХРАНИТЕЛЬ • %s / %s", Format.Number(hp), Format.Number(maxHp))
		bossTimer.Text = string.format("⏱ %dс", math.ceil(left))
		bossTimer.TextColor3 = if left < 10 then Theme.Bad else Theme.Text
		bossFill.Size = UDim2.fromScale(math.clamp(hp / maxHp, 0, 1), 1)
	end

	local showCombo = combo >= 5 and os.clock() - comboTime < Config.Combo.window + 0.4
	comboLabel.Visible = showCombo
	if showCombo then
		comboLabel.Text = string.format("🔥 КОМБО %d  %s", combo, Format.Multiplier(Config.ComboMultiplier(combo)))
		local k = math.min(combo, Config.Combo.max) / Config.Combo.max
		comboLabel.TextColor3 = Theme.Gold:Lerp(Color3.fromRGB(255, 80, 60), k)
		comboLabel.TextSize = 28 + k * 10
	end
end

DataChanged.OnClientEvent:Connect(function(snapshot)
	local previous = state
	state = snapshot
	if previous and snapshot.essence > previous.essence then
		essenceScale.Scale = 1.12
		TweenService:Create(essenceScale, TweenInfo.new(0.2), { Scale = 1 }):Play()
	end
	refreshTopBar()
	refreshPanel()
end)

NotifyRemote.OnClientEvent:Connect(showToast)

FxRemote.OnClientEvent:Connect(function(kind: string, ...)
	local handler = Fx[kind]
	if type(handler) == "function" then
		local ok, err = pcall(handler, ...)
		if not ok then
			warn("[Fx] " .. kind .. ": " .. tostring(err))
		end
	end
end)

-- Пульсация подарка, когда он готов
task.spawn(function()
	while true do
		if state and dailyReady(state) then
			local grow = TweenService:Create(giftScale, TweenInfo.new(0.5, Enum.EasingStyle.Sine), { Scale = 1.12 })
			grow:Play()
			grow.Completed:Wait()
			local shrink = TweenService:Create(giftScale, TweenInfo.new(0.5, Enum.EasingStyle.Sine), { Scale = 1 })
			shrink:Play()
			shrink.Completed:Wait()
		else
			task.wait(1)
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(0.1)
		refreshWorldHud()
	end
end)

task.spawn(function()
	while true do
		task.wait(0.5)
		refreshTopBar()
		refreshPanel()
	end
end)

-- Подсветка тени под курсором (на компьютере)
local hoverHighlight = Instance.new("Highlight")
hoverHighlight.FillColor = Color3.fromRGB(255, 240, 190)
hoverHighlight.FillTransparency = 0.75
hoverHighlight.OutlineColor = Color3.fromRGB(255, 240, 190)
hoverHighlight.OutlineTransparency = 0
hoverHighlight.DepthMode = Enum.HighlightDepthMode.Occluded
hoverHighlight.Enabled = false
hoverHighlight.Parent = workspace

local mouse = player:GetMouse()
task.spawn(function()
	while true do
		task.wait(0.05)
		local shadows = workspace:FindFirstChild("Shadows")
		local target = mouse.Target
		local body = nil
		if shadows and target then
			body = if target.Parent == shadows then target elseif target.Parent and target.Parent.Parent == shadows then target.Parent else nil
		end
		hoverHighlight.Adornee = body
		hoverHighlight.Enabled = body ~= nil
	end
end)

-- Запрашиваем данные, если первый снимок пришёл раньше, чем скрипт запустился
sendAction("sync")
