import re

with open(r'd:\Dev\kinich-Agro\motor_genetico\core\templates.py', 'r', encoding='utf-8') as f:
    data = f.read()

# Only target the 'resources' block
# Wait, actually we can target the specific lines where it's resources:
# "OXIGENO_L": {"value": 1500, "max": 2000},

def remove_max(match):
    return match.group(1) + "}"

data = re.sub(r'(\"value\":\s*\d+(?:\.\d+)?),\s*\"max\":\s*\d+(?:\.\d+)?\s*\}', remove_max, data)
# Fix Requirements max just in case we need it? No, keep requirements max, GA relies on requirements max maybe?
# Wait, fitness.py uses req.value! It never uses req.max.
# "coverage = np.minimum(1.0, allocated / req_val) if req_val > 0 else np.ones(pop_size)"
# Actually, the frontend uses req.max for sliders. If resources don't have max, what happens to requirements max? 
# I will keep req max for now, or just let the regex replace all maxes.
# Let's replace only resources max.

with open(r'd:\Dev\kinich-Agro\motor_genetico\core\templates.py', 'w', encoding='utf-8') as f:
    f.write(data)
