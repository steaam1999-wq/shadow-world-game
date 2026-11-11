-- Game Passes и Developer Products.
-- ID задаются в ReplicatedStorage.Shared.Config.

local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Format = require(ReplicatedStorage.Shared.Format)
local DataService = require(script.Parent.DataService)
local GameService = require(script.Parent.GameService)

local MonetizationService = {}

local passKeyById = {} -- [gamePassId] = "DoubleEssence"
local productById = {} -- [productId] = def

for key, def in Config.GamePasses do
	if def.id ~= 0 then
		passKeyById[def.id] = key
	end
end
for _, def in Config.Products do
	if def.id ~= 0 then
		productById[def.id] = def
	end
end

local function grantPass(player: Player, key: string)
	local session = DataService.Get(player)
	if not session then
		return
	end
	session.passes[key] = true
	GameService.ApplySpeed(player)
	DataService.Push(player)
end

local function checkPasses(player: Player)
	local session = DataService.Get(player)
	if not session then
		return
	end
	for key, def in Config.GamePasses do
		if def.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, def.id)
			end)
			if ok and owns then
				session.passes[key] = true
			end
		end
	end
	GameService.ApplySpeed(player)
	DataService.Push(player)
end

-- Выдача Developer Products по типу.
local productHandlers = {
	essence = function(player: Player, def)
		local data = DataService.Get(player).data
		local amount = Config.EssencePackAmount(def, data.unlockedZone, data.rebirths)
		GameService.AddEssence(player, amount, true)
		GameService.Notify(player, "Спасибо за покупку! +" .. Format.Number(amount) .. " эссенции", "good")
	end,

	boost = function(player: Player, def)
		local data = DataService.Get(player).data
		data.boostEndsAt = math.max(data.boostEndsAt, os.time()) + def.duration
		DataService.Push(player)
		GameService.Notify(player, "Буст x2 активирован!", "good")
	end,
}

local function processReceipt(receipt)
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local session = DataService.Get(player)
	if not session then
		-- Данные ещё не загружены — Roblox повторит попытку позже.
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	-- Эта покупка уже выдана (повторный вызов) — не выдаём второй раз.
	if session.data.purchases[receipt.PurchaseId] then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	local def = productById[receipt.ProductId]
	local handler = def and productHandlers[def.kind]
	if not handler then
		warn("[Monetization] неизвестный продукт: " .. tostring(receipt.ProductId))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local ok, err = pcall(handler, player, def)
	if not ok then
		warn("[Monetization] ошибка выдачи: " .. tostring(err))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	DataService.RecordPurchase(player, receipt.PurchaseId)

	-- Подтверждаем покупку только после сохранения — иначе при сбое игрок потеряет товар.
	if session.canSave and not DataService.Save(player) then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

function MonetizationService.Init()
	DataService.OnPlayerLoaded(checkPasses)

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
		local key = passKeyById[passId]
		if purchased and key then
			grantPass(player, key)
			GameService.Notify(player, "Куплено: " .. Config.GamePasses[key].name .. "!", "good")
		end
	end)

	MarketplaceService.ProcessReceipt = processReceipt
end

return MonetizationService
