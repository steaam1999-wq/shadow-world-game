-- Визуальные эффекты на клиенте: числа урона, награды, выстрелы духов,
-- окна (вылупление питомца, перерождение, награды) и баннер Хранителя.

local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))
local UI = require(script.Parent:WaitForChild("UI"))
local Theme = UI.Theme

local Fx = {}

local gui: ScreenGui
local modal: Frame
local modalBox: Frame
local banner: TextLabel
local effectsFolder: Folder

-- Колбэк для комбо: Main показывает счётчик
Fx.OnCombo = function(_combo: number) end
-- Колбэк: в какой зоне сейчас игрок (для баннера Хранителя)
Fx.CurrentZone = function(): number
	return 1
end

---------------------------------------------------------------------
-- Всплывающий текст в мире
---------------------------------------------------------------------

local function floatingText(position: Vector3, text: string, color: Color3, size: number, rise: number?)
	local anchor = Instance.new("Part")
	anchor.Anchored = true
	anchor.CanCollide = false
	anchor.CanQuery = false
	anchor.CanTouch = false
	anchor.Transparency = 1
	anchor.Size = Vector3.new(0.2, 0.2, 0.2)
	anchor.Position = position + Vector3.new(math.random(-15, 15) / 10, 0, math.random(-15, 15) / 10)
	anchor.Parent = effectsFolder

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromOffset(260, size + 16)
	billboard.StudsOffset = Vector3.new(0, 2, 0)
	billboard.AlwaysOnTop = true
	billboard.LightInfluence = 0
	billboard.MaxDistance = 120
	billboard.Parent = anchor

	local label = UI.label({
		Size = UDim2.fromScale(1, 1),
		Text = text,
		TextColor3 = color,
		TextSize = size,
		Font = Enum.Font.GothamBlack,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.2,
		TextWrapped = false,
		Parent = billboard,
	})
	local scale = UI.new("UIScale", { Scale = 1.5, Parent = label })

	TweenService:Create(scale, TweenInfo.new(0.15, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	TweenService:Create(billboard, TweenInfo.new(1, Enum.EasingStyle.Quad), {
		StudsOffset = Vector3.new(0, 2 + (rise or 4), 0),
	}):Play()
	task.delay(0.45, function()
		TweenService:Create(label, TweenInfo.new(0.5), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	end)
	Debris:AddItem(anchor, 1.1)
end

local function invisibleAnchor(position: Vector3): Part
	local anchor = Instance.new("Part")
	anchor.Anchored = true
	anchor.CanCollide = false
	anchor.CanQuery = false
	anchor.CanTouch = false
	anchor.Transparency = 1
	anchor.Size = Vector3.new(0.2, 0.2, 0.2)
	anchor.Position = position
	anchor.Parent = effectsFolder
	return anchor
end

-- Взрыв светящихся частиц
local function burst(position: Vector3, color: Color3, count: number, speed: number?)
	local anchor = invisibleAnchor(position)
	local emitter = Instance.new("ParticleEmitter")
	emitter.Rate = 0
	emitter.Color = ColorSequence.new(color)
	emitter.LightEmission = 1
	emitter.Lifetime = NumberRange.new(0.4, 0.9)
	emitter.Speed = NumberRange.new((speed or 1) * 8, (speed or 1) * 18)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Drag = 3
	emitter.Acceleration = Vector3.new(0, -12, 0)
	emitter.Size = NumberSequence.new(0.6, 0)
	emitter.Transparency = NumberSequence.new(0, 1)
	emitter.Parent = anchor
	emitter:Emit(count)
	Debris:AddItem(anchor, 1.5)
end

-- Кольцо-вспышка, расходящееся от точки
local function shockwave(position: Vector3, color: Color3, size: number)
	local ring = Instance.new("Part")
	ring.Shape = Enum.PartType.Cylinder
	ring.Anchored = true
	ring.CanCollide = false
	ring.CanQuery = false
	ring.CanTouch = false
	ring.Material = Enum.Material.Neon
	ring.Color = color
	ring.Transparency = 0.3
	ring.Size = Vector3.new(0.2, 1, 1)
	ring.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.rad(90))
	ring.Parent = effectsFolder
	TweenService:Create(ring, TweenInfo.new(0.45, Enum.EasingStyle.Quad), {
		Size = Vector3.new(0.2, size, size),
		Transparency = 1,
	}):Play()
	Debris:AddItem(ring, 0.5)
end

-- Луч фонаря от игрока к тени
local function lanternBeam(target: Vector3)
	local character = Players.LocalPlayer.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	local start = Instance.new("Attachment")
	start.Position = Vector3.new(0.9, 1.2, -1)
	start.Parent = root

	local anchor = invisibleAnchor(target)
	local finish = Instance.new("Attachment")
	finish.Parent = anchor

	local beam = Instance.new("Beam")
	beam.Attachment0 = start
	beam.Attachment1 = finish
	beam.Width0 = 0.3
	beam.Width1 = 3
	beam.FaceCamera = true
	beam.LightEmission = 1
	beam.Color = ColorSequence.new(Color3.fromRGB(255, 240, 190))
	beam.Transparency = NumberSequence.new(0.75, 0.25)
	beam.Segments = 1
	beam.Parent = anchor

	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(255, 240, 190)
	light.Range = 10
	light.Brightness = 3
	light.Parent = anchor

	Debris:AddItem(anchor, 0.12)
	Debris:AddItem(start, 0.12)
end

-- Тряска камеры
local shakeToken = 0
local function cameraShake(intensity: number, duration: number)
	local character = Players.LocalPlayer.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		return
	end
	shakeToken += 1
	local token = shakeToken
	local started = os.clock()
	task.spawn(function()
		while os.clock() - started < duration and token == shakeToken do
			local k = 1 - (os.clock() - started) / duration
			humanoid.CameraOffset = Vector3.new(
				(math.random() - 0.5) * intensity * k,
				(math.random() - 0.5) * intensity * k,
				0
			)
			RunService.RenderStepped:Wait()
		end
		if token == shakeToken then
			humanoid.CameraOffset = Vector3.zero
		end
	end)
end

-- Вспышка на весь экран
local function screenFlash(color: Color3, strength: number)
	local frame = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = color,
		BackgroundTransparency = 1 - strength,
		BorderSizePixel = 0,
		ZIndex = 45,
		Parent = gui,
	})
	local fade = TweenService:Create(frame, TweenInfo.new(0.35), { BackgroundTransparency = 1 })
	fade:Play()
	fade.Completed:Once(function()
		frame:Destroy()
	end)
end

function Fx.damage(position: Vector3, amount: number, crit: boolean, combo: number, source: string)
	if source == "tap" or source == "auto" then
		lanternBeam(position)
	end
	if crit then
		cameraShake(0.35, 0.15)
		burst(position, Theme.Gold, 10, 0.8)
	end
	if crit then
		floatingText(position, "КРИТ " .. Format.Number(amount), Theme.Gold, 30, 5)
	elseif source == "spirit" then
		floatingText(position, Format.Number(amount), Color3.fromRGB(217, 198, 255), 18, 3)
	else
		floatingText(position, Format.Number(amount), Color3.new(1, 1, 1), 22, 4)
	end
	if source == "tap" then
		Fx.OnCombo(combo)
	end
end

function Fx.reward(position: Vector3, amount: number, gems: number, lucky: boolean, kind: string)
	local up = position + Vector3.new(0, 2, 0)
	local color = if kind == "boss"
		then Color3.fromRGB(255, 70, 90)
		elseif kind == "gold" or lucky then Color3.fromRGB(255, 215, 90)
		else Color3.fromRGB(190, 150, 255)
	burst(position, color, if kind == "boss" then 80 else 22, if kind == "boss" then 2 else 1)
	shockwave(position, color, if kind == "boss" then 40 else 12)
	if kind == "boss" then
		cameraShake(1.2, 0.6)
		screenFlash(Color3.fromRGB(255, 220, 150), 0.35)
	end
	floatingText(up, "+" .. Format.Number(amount) .. " 🌑", Color3.fromRGB(255, 226, 138), if kind == "boss" then 40 else 28, 6)
	if gems > 0 then
		task.delay(0.15, floatingText, up + Vector3.new(0, 1.5, 0), "+" .. gems .. " 💎", Theme.Gem, 26, 7)
	end
	if lucky then
		task.delay(0.1, floatingText, up + Vector3.new(0, 3, 0), "🍀 УДАЧА x10!", Theme.Good, 26, 8)
	end
	if kind == "boss" then
		Fx.toast("⚔ Хранитель повержен! +" .. gems .. " 💎", "gold")
	end
end

-- Сгусток духа-помощника летит от питомца к тени
function Fx.bolt(from: Vector3, target: BasePart)
	if not target or not target.Parent then
		return
	end
	local orb = Instance.new("Part")
	orb.Shape = Enum.PartType.Ball
	orb.Size = Vector3.new(0.9, 0.9, 0.9)
	orb.Material = Enum.Material.Neon
	orb.Color = Color3.fromRGB(210, 180, 255)
	orb.Anchored = true
	orb.CanCollide = false
	orb.CanQuery = false
	orb.CanTouch = false
	orb.Position = from
	orb.Parent = effectsFolder

	local trail = Instance.new("PointLight")
	trail.Color = orb.Color
	trail.Range = 8
	trail.Parent = orb

	TweenService:Create(orb, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position = target.Position,
		Size = Vector3.new(0.4, 0.4, 0.4),
	}):Play()
	Debris:AddItem(orb, 0.3)
end

---------------------------------------------------------------------
-- Уведомления (задаются из Main)
---------------------------------------------------------------------
Fx.toast = function(_text: string, _kind: string?) end

---------------------------------------------------------------------
-- Модальное окно
---------------------------------------------------------------------

local function closeModal()
	modal.Visible = false
end

-- options: { emoji, accent, overline, title, text, button, buttonColor }
function Fx.showModal(options)
	for _, child in modalBox:GetChildren() do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
	local accent = options.accent or Theme.Accent
	modalBox:FindFirstChildOfClass("UIStroke").Color = accent

	local emoji = UI.label({
		Size = UDim2.new(1, 0, 0, 96),
		Text = options.emoji or "✨",
		TextSize = 80,
		TextXAlignment = Enum.TextXAlignment.Center,
		LayoutOrder = 1,
		Parent = modalBox,
	})
	if options.overline then
		UI.label({
			Size = UDim2.new(1, 0, 0, 20),
			Text = options.overline,
			TextColor3 = accent,
			Font = Enum.Font.GothamBlack,
			TextSize = 15,
			TextXAlignment = Enum.TextXAlignment.Center,
			LayoutOrder = 2,
			Parent = modalBox,
		})
	end
	if options.title then
		UI.label({
			Size = UDim2.new(1, 0, 0, 32),
			Text = options.title,
			Font = Enum.Font.GothamBlack,
			TextSize = 24,
			TextXAlignment = Enum.TextXAlignment.Center,
			LayoutOrder = 3,
			Parent = modalBox,
		})
	end
	if options.text then
		UI.label({
			Size = UDim2.new(1, 0, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			Text = options.text,
			RichText = true,
			TextColor3 = Theme.Muted,
			Font = Enum.Font.GothamMedium,
			TextSize = 16,
			TextXAlignment = Enum.TextXAlignment.Center,
			LayoutOrder = 4,
			Parent = modalBox,
		})
	end
	if options.button then
		local button = UI.button({
			Size = UDim2.new(1, 0, 0, 48),
			Text = options.button,
			LayoutOrder = 5,
			Parent = modalBox,
		})
		UI.setButton(button, options.button, true, options.buttonColor or Theme.Good)
		button.Activated:Connect(closeModal)
	end

	modal.Visible = true
	local scale = modalBox:FindFirstChildOfClass("UIScale")
	scale.Scale = 0.7
	TweenService:Create(scale, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	return emoji
end

function Fx.hatch(pet, autoEquipped: boolean)
	local info = Config.PetInfo(pet)
	local rarity = Config.Rarities[pet.rarity]
	local isGold = pet.rarity == "legendary" or pet.rarity == "epic"

	-- 1. Яйцо трясётся
	local egg = Fx.showModal({ emoji = "🥚", text = "Вылупляется…" })
	egg.Rotation = 0
	local shake = TweenService:Create(egg, TweenInfo.new(0.09, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, 8, true), { Rotation = 14 })
	shake:Play()

	-- 2. Появляется питомец
	task.delay(0.95, function()
		local essence, damage = Config.PetStats(pet)
		local bonus = string.format("+%d%% эссенции", math.round(essence * 100))
		if damage > 0 then
			bonus ..= string.format(" • +%d%% урона", math.round(damage * 100))
		end
		local reveal = Fx.showModal({
			emoji = info.emoji,
			accent = rarity.color,
			overline = string.upper(rarity.name) .. " • T" .. pet.tier,
			title = info.name,
			text = bonus .. (if autoEquipped then "\n✓ Сразу надет" else ""),
			button = if isGold then "Невероятно!" else "Круто!",
		})
		local scale = UI.new("UIScale", { Scale = 0.2, Parent = reveal })
		TweenService:Create(scale, TweenInfo.new(0.4, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	end)
end

function Fx.levelUp(level: number)
	screenFlash(Theme.Gold, 0.3)
	local character = Players.LocalPlayer.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if root then
		burst(root.Position, Theme.Gold, 60, 1.5)
		shockwave(root.Position - Vector3.new(0, 2.5, 0), Theme.Gold, 30)
	end
	floatingText(workspace.CurrentCamera.CFrame.Position + workspace.CurrentCamera.CFrame.LookVector * 12, "⭐ УРОВЕНЬ " .. level, Theme.Gold, 34, 3)
end

function Fx.offline(amount: number, away: number)
	local hours = away // 3600
	local minutes = (away % 3600) // 60
	local time = if hours > 0 then string.format("%d ч %d мин", hours, minutes) else string.format("%d мин", minutes)
	Fx.showModal({
		emoji = "🌙",
		accent = Theme.Gold,
		title = "С возвращением!",
		text = string.format("Пока вас не было (%s), духи-помощники собрали\n<b><font color=\"#ffc94d\">+%s эссенции</font></b>", time, Format.Number(amount)),
		button = "Забрать",
		buttonColor = Theme.Gold,
	})
end

function Fx.daily(streak: number, reward: number, gems: number)
	Fx.showModal({
		emoji = "🎁",
		accent = Theme.Gold,
		title = string.format("День %d из %d", streak, Config.Daily.maxStreak),
		text = string.format("<b>+%s</b> эссенции и <b>+%d 💎</b>\nЗаходите завтра — награда вырастет!", Format.Number(reward), gems),
		button = "Забрать",
	})
end

function Fx.rebirth(rebirths: number, gems: number)
	Fx.showModal({
		emoji = "♻️",
		accent = Theme.Gold,
		title = "Перерождение " .. rebirths .. "!",
		text = string.format(
			"Множитель эссенции: <b>x%s</b>\nНаграда: <b>+%d 💎</b>\nПитомцы, уровень и кристаллы сохранены.",
			tostring(Config.RebirthMultiplier(rebirths)),
			gems
		),
		button = "Вперёд!",
		buttonColor = Theme.Gold,
	})
end

function Fx.boss(zoneIndex: number)
	if Fx.CurrentZone() ~= zoneIndex then
		return
	end
	cameraShake(0.6, 0.4)
	screenFlash(Color3.fromRGB(255, 40, 70), 0.25)
	banner.Visible = true
	banner.TextTransparency = 0
	banner.TextStrokeTransparency = 0
	local scale = banner:FindFirstChildOfClass("UIScale")
	scale.Scale = 2
	TweenService:Create(scale, TweenInfo.new(0.3, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	task.delay(2, function()
		local fade = TweenService:Create(banner, TweenInfo.new(0.4), { TextTransparency = 1, TextStrokeTransparency = 1 })
		fade:Play()
		fade.Completed:Wait()
		banner.Visible = false
	end)
end

---------------------------------------------------------------------

function Fx.Init(screenGui: ScreenGui)
	gui = screenGui

	effectsFolder = Instance.new("Folder")
	effectsFolder.Name = "ClientEffects"
	effectsFolder.Parent = workspace

	modal = UI.new("TextButton", {
		Name = "Modal",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.new(0, 0, 0),
		BackgroundTransparency = 0.35,
		Text = "",
		AutoButtonColor = false,
		Visible = false,
		ZIndex = 50,
		Parent = gui,
	})
	modalBox = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(340, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = Theme.Panel2,
		ZIndex = 51,
		Parent = modal,
	}, {
		UI.corner(20),
		UI.stroke(Theme.Accent, 2.5, 0),
		UI.gradient(Color3.fromRGB(255, 255, 255), Color3.fromRGB(150, 140, 180)),
		UI.new("UIScale", { Scale = 1 }),
		UI.new("UIPadding", {
			PaddingTop = UDim.new(0, 18),
			PaddingBottom = UDim.new(0, 18),
			PaddingLeft = UDim.new(0, 18),
			PaddingRight = UDim.new(0, 18),
		}),
		UI.new("UIListLayout", {
			Padding = UDim.new(0, 8),
			SortOrder = Enum.SortOrder.LayoutOrder,
			HorizontalAlignment = Enum.HorizontalAlignment.Center,
		}),
	})

	banner = UI.label({
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.36),
		Size = UDim2.fromOffset(600, 60),
		Text = "⚔ ХРАНИТЕЛЬ ЗОНЫ!",
		TextColor3 = Color3.fromRGB(255, 90, 110),
		TextSize = 42,
		Font = Enum.Font.GothamBlack,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0,
		Visible = false,
		ZIndex = 40,
		Parent = gui,
	})
	UI.new("UIScale", { Scale = 1, Parent = banner })
end

return Fx
