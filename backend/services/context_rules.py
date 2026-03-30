def is_weather_compatible(item, weather):

    category = item.get("category", "")
    temp = weather.get("temperature", 25)

    # 🔥 Simple rules
    if temp > 30:
        return category in ["t-shirt", "shirt"]

    elif temp < 20:
        return category in ["jacket", "shirt"]

    else:
        return True