from .schemas import DynamicTemplate

UNIVERSAL_TEMPLATE = {
    "template_id": "colonia_marciana_universal",
    "name": "Simulación Global de la Colonia",
    "description": "Simulación con estructura estricta en cascada para validar la jerarquía de recursos.",
    "crisis_factors": {},
    "resources": {
        "AGUA_L": {"value": 1000},
        "ENERGIA_KWH": {"value": 2000},
        "COMIDA_KG": {"value": 500}
    },
    "consumers": {
        "INVERNADERO": {
            "priority_weight": 0.8,
            "requirements": {
                "AGUA_L": {"value": 200},
                "ENERGIA_KWH": {"value": 300}
            },
            "subconsumers": {
                "CULTIVO_PAPAS": {
                    "priority_weight": 0.9,
                    "requirements": {
                        "AGUA_L": {"value": 150},
                        "ENERGIA_KWH": {"value": 150}
                    }
                },
                "CULTIVO_SOYA": {
                    "priority_weight": 0.7,
                    "requirements": {
                        "AGUA_L": {"value": 50},
                        "ENERGIA_KWH": {"value": 150}
                    }
                }
            }
        },
        "HABITAT": {
            "priority_weight": 0.95,
            "requirements": {
                "AGUA_L": {"value": 800},
                "ENERGIA_KWH": {"value": 1700},
                "COMIDA_KG": {"value": 500}
            },
            "subconsumers": {
                "AGUA_PARA_BEBER": {
                    "priority_weight": 1.0,
                    "requirements": {
                        "AGUA_L": {"value": 300}
                    }
                },
                "BUNKER_RADIACION": {
                    "priority_weight": 0.9,
                    "requirements": {
                        "AGUA_L": {"value": 100},
                        "ENERGIA_KWH": {"value": 500}
                    }
                },
                "CALEFACCION": {
                    "priority_weight": 0.85,
                    "requirements": {
                        "AGUA_L": {"value": 200},
                        "ENERGIA_KWH": {"value": 800}
                    }
                },
                "COMEDOR": {
                    "priority_weight": 0.95,
                    "requirements": {
                        "COMIDA_KG": {"value": 500}
                    }
                },
                "OPERACIONES_BASE_HABITAT": {
                    "priority_weight": 0.8,
                    "requirements": {
                        "AGUA_L": {"value": 200},
                        "ENERGIA_KWH": {"value": 400}
                    }
                }
            }
        }
    },
    "population_size": 200,
    "max_generations": 50,
    "emit_every_n": 5
}

def get_templates():
    return [DynamicTemplate(**UNIVERSAL_TEMPLATE)]
