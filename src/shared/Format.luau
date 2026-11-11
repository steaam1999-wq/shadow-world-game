-- Красивое отображение чисел и времени.

local Format = {}

local SUFFIXES = { "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc" }

local function trimZeros(text: string): string
	if string.find(text, "%.") then
		text = (string.gsub(text, "0+$", ""))
		text = (string.gsub(text, "%.$", ""))
	end
	return text
end

-- 1234 -> "1.23K", 5600000 -> "5.6M"
function Format.Number(value: number): string
	value = math.floor(value or 0)
	if math.abs(value) < 1000 then
		return tostring(value)
	end

	local index = 1
	local scaled = value
	while math.abs(scaled) >= 1000 and index < #SUFFIXES do
		scaled /= 1000
		index += 1
	end

	local text
	if math.abs(scaled) >= 100 then
		text = string.format("%.0f", scaled)
	elseif math.abs(scaled) >= 10 then
		text = string.format("%.1f", scaled)
	else
		text = string.format("%.2f", scaled)
	end
	return trimZeros(text) .. SUFFIXES[index]
end

-- 2.5 -> "x2.5"
function Format.Multiplier(value: number): string
	return "x" .. trimZeros(string.format("%.2f", value))
end

-- 3725 -> "1:02:05", 125 -> "2:05"
function Format.Duration(seconds: number): string
	seconds = math.max(0, math.floor(seconds))
	local hours = seconds // 3600
	local minutes = (seconds % 3600) // 60
	local secs = seconds % 60
	if hours > 0 then
		return string.format("%d:%02d:%02d", hours, minutes, secs)
	end
	return string.format("%d:%02d", minutes, secs)
end

return Format
