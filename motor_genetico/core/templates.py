from .schemas import DynamicTemplate

TEMPLATES = [
    {
        "template_id": "soporte_vital_multicapa",
        "name": "Falla Crítica de Soporte Vital Multicapa",
        "description": "Fallo sistémico que compromete O2, agua y presión atmosférica. La escasez obliga a decidir entre mantener cultivos o salvar la tripulación.",
        "resources": {
            "OXIGENO_L": {"value": 400, "max": 1500},
            "ENERGIA_KWH": {"value": 800, "max": 2000},
            "AGUA_FILTRADA_L": {"value": 350, "max": 1000},
            "UNIDADES_PRESION_ATM": {"value": 150, "max": 300},
            "BIOMASA_KG": {"value": 100, "max": 300}
        },
        "consumers": {
            "TRIPULACION": {
                "requirements": {
                    "OXIGENO_L": {"value": 300, "max": 600},
                    "AGUA_FILTRADA_L": {"value": 150, "max": 300},
                    "BIOMASA_KG": {"value": 50, "max": 100},
                    "UNIDADES_PRESION_ATM": {"value": 80, "max": 120}
                },
                "priority_weight": 0.95
            },
            "INVERNADERO_PRINCIPAL": {
                "requirements": {
                    "AGUA_FILTRADA_L": {"value": 250, "max": 500},
                    "ENERGIA_KWH": {"value": 300, "max": 600},
                    "BIOMASA_KG": {"value": 40, "max": 80},
                    "UNIDADES_PRESION_ATM": {"value": 60, "max": 100}
                },
                "priority_weight": 0.6
            },
            "AREA_MEDICA": {
                "requirements": {
                    "OXIGENO_L": {"value": 100, "max": 300},
                    "ENERGIA_KWH": {"value": 150, "max": 300},
                    "AGUA_FILTRADA_L": {"value": 100, "max": 200}
                },
                "priority_weight": 0.85
            },
            "RECICLADOR_HIDRICO": {
                "requirements": {
                    "ENERGIA_KWH": {"value": 250, "max": 500},
                    "UNIDADES_PRESION_ATM": {"value": 50, "max": 100},
                    "BIOMASA_KG": {"value": 20, "max": 50}
                },
                "priority_weight": 0.5
            },
            "SISTEMAS_NAVEGACION": {
                "requirements": {
                    "ENERGIA_KWH": {"value": 400, "max": 800},
                    "OXIGENO_L": {"value": 50, "max": 150},
                    "UNIDADES_PRESION_ATM": {"value": 70, "max": 100}
                },
                "priority_weight": 0.7
            }
        }
    },
    {
        "template_id": "epidemia_fungica",
        "name": "Epidemia Fúngica en Invernadero con Sequía",
        "description": "Una espora amenaza las fuentes biológicas. Requiere balancear químicos antifúngicos, energía lumínica y refrigeración extrema.",
        "resources": {
            "ANTIFUNGICO_DOSIS": {"value": 120, "max": 500},
            "AGUA_PURA_L": {"value": 350, "max": 1200},
            "ENERGIA_LUMINICA_KW": {"value": 500, "max": 1500},
            "UNIDADES_REFRIGERACION": {"value": 100, "max": 300},
            "FERTILIZANTE_KG": {"value": 90, "max": 250}
        },
        "consumers": {
            "CULTIVOS_VITALES_PAPAS": {
                "requirements": {
                    "ANTIFUNGICO_DOSIS": {"value": 80, "max": 150},
                    "AGUA_PURA_L": {"value": 200, "max": 400},
                    "FERTILIZANTE_KG": {"value": 60, "max": 100},
                    "ENERGIA_LUMINICA_KW": {"value": 300, "max": 600}
                },
                "priority_weight": 0.8
            },
            "MICROALGAS_O2": {
                "requirements": {
                    "ANTIFUNGICO_DOSIS": {"value": 50, "max": 100},
                    "AGUA_PURA_L": {"value": 150, "max": 300},
                    "ENERGIA_LUMINICA_KW": {"value": 200, "max": 500},
                    "UNIDADES_REFRIGERACION": {"value": 50, "max": 120}
                },
                "priority_weight": 0.9
            },
            "TRIPULACION": {
                "requirements": {
                    "AGUA_PURA_L": {"value": 200, "max": 400},
                    "UNIDADES_REFRIGERACION": {"value": 80, "max": 150},
                    "ANTIFUNGICO_DOSIS": {"value": 20, "max": 60}
                },
                "priority_weight": 0.85
            },
            "LABORATORIO_BOTANICO": {
                "requirements": {
                    "FERTILIZANTE_KG": {"value": 40, "max": 100},
                    "ENERGIA_LUMINICA_KW": {"value": 150, "max": 300},
                    "UNIDADES_REFRIGERACION": {"value": 40, "max": 80},
                    "AGUA_PURA_L": {"value": 50, "max": 150}
                },
                "priority_weight": 0.4
            }
        }
    },
    {
        "template_id": "impacto_meteorito",
        "name": "Impacto de Meteorito en Sector Logístico",
        "description": "Daños estructurales severos. Obliga a asignar drones y sellador térmico mientras se mantiene comunicación y oxígeno.",
        "resources": {
            "SELLADOR_TERMICO_KG": {"value": 100, "max": 400},
            "ENERGIA_RESERVA_KW": {"value": 800, "max": 2000},
            "ANCHO_DE_BANDA_MBPS": {"value": 40, "max": 200},
            "OXIGENO_L": {"value": 550, "max": 1500},
            "DRONES_OPERATIVOS": {"value": 7, "max": 20}
        },
        "consumers": {
            "CUADRILLAS_REPARACION": {
                "requirements": {
                    "SELLADOR_TERMICO_KG": {"value": 80, "max": 150},
                    "OXIGENO_L": {"value": 150, "max": 300},
                    "DRONES_OPERATIVOS": {"value": 5, "max": 10},
                    "ANCHO_DE_BANDA_MBPS": {"value": 20, "max": 50}
                },
                "priority_weight": 0.85
            },
            "MODULO_CUARENTENA": {
                "requirements": {
                    "ENERGIA_RESERVA_KW": {"value": 400, "max": 800},
                    "OXIGENO_L": {"value": 200, "max": 400},
                    "SELLADOR_TERMICO_KG": {"value": 30, "max": 80},
                    "ANCHO_DE_BANDA_MBPS": {"value": 10, "max": 30}
                },
                "priority_weight": 0.9
            },
            "HABITAT_PRINCIPAL": {
                "requirements": {
                    "ENERGIA_RESERVA_KW": {"value": 600, "max": 1200},
                    "OXIGENO_L": {"value": 300, "max": 600},
                    "ANCHO_DE_BANDA_MBPS": {"value": 15, "max": 40}
                },
                "priority_weight": 0.65
            },
            "SENSORES_EXTERNOS": {
                "requirements": {
                    "ENERGIA_RESERVA_KW": {"value": 150, "max": 300},
                    "DRONES_OPERATIVOS": {"value": 4, "max": 8},
                    "ANCHO_DE_BANDA_MBPS": {"value": 25, "max": 60},
                    "SELLADOR_TERMICO_KG": {"value": 20, "max": 50}
                },
                "priority_weight": 0.5
            }
        }
    },
    {
        "template_id": "fuga_radiacion",
        "name": "Fuga de Radiación del Reactor Core",
        "description": "El núcleo requiere enfriamiento inmediato y blindaje. Conflicto extremo por energía de emergencia y robots de mantenimiento.",
        "resources": {
            "BLINDAJE_PLOMO_KG": {"value": 300, "max": 1000},
            "ENERGIA_EMERGENCIA_KW": {"value": 600, "max": 1500},
            "SUPRESORES_RAD_DOSIS": {"value": 90, "max": 300},
            "AGUA_REFRIGERANTE_L": {"value": 700, "max": 2500},
            "ROBOTS_MANTENIMIENTO": {"value": 8, "max": 30}
        },
        "consumers": {
            "NUCLEO_REACTOR": {
                "requirements": {
                    "AGUA_REFRIGERANTE_L": {"value": 600, "max": 1200},
                    "BLINDAJE_PLOMO_KG": {"value": 200, "max": 400},
                    "ROBOTS_MANTENIMIENTO": {"value": 6, "max": 15},
                    "ENERGIA_EMERGENCIA_KW": {"value": 300, "max": 600}
                },
                "priority_weight": 0.95
            },
            "CENTRO_MEDICO": {
                "requirements": {
                    "SUPRESORES_RAD_DOSIS": {"value": 80, "max": 150},
                    "ENERGIA_EMERGENCIA_KW": {"value": 200, "max": 400},
                    "BLINDAJE_PLOMO_KG": {"value": 50, "max": 100}
                },
                "priority_weight": 0.8
            },
            "SECTOR_RESIDENCIAL": {
                "requirements": {
                    "BLINDAJE_PLOMO_KG": {"value": 150, "max": 300},
                    "AGUA_REFRIGERANTE_L": {"value": 300, "max": 600},
                    "ENERGIA_EMERGENCIA_KW": {"value": 150, "max": 300},
                    "SUPRESORES_RAD_DOSIS": {"value": 30, "max": 80}
                },
                "priority_weight": 0.7
            },
            "GRANJA_HIDROPONICA": {
                "requirements": {
                    "AGUA_REFRIGERANTE_L": {"value": 400, "max": 800},
                    "ENERGIA_EMERGENCIA_KW": {"value": 250, "max": 500},
                    "ROBOTS_MANTENIMIENTO": {"value": 4, "max": 10}
                },
                "priority_weight": 0.4
            }
        }
    },
    {
        "template_id": "tormenta_polvo",
        "name": "Tormenta de Polvo Marciano Extrema",
        "description": "Sin generación solar. Dependencia total de baterías, requerimientos estrictos de filtrado de aire y aislamiento térmico.",
        "resources": {
            "FILTROS_AIRE_UNIDADES": {"value": 35, "max": 100},
            "BATERIAS_ION_KW": {"value": 1000, "max": 3000},
            "AISLAMIENTO_TERMICO_M2": {"value": 120, "max": 500},
            "UNIDADES_PRESION_ATM": {"value": 60, "max": 150},
            "COMIDA_DESHIDRATADA_KG": {"value": 180, "max": 600}
        },
        "consumers": {
            "HABITAT_PRINCIPAL": {
                "requirements": {
                    "FILTROS_AIRE_UNIDADES": {"value": 15, "max": 30},
                    "BATERIAS_ION_KW": {"value": 400, "max": 800},
                    "UNIDADES_PRESION_ATM": {"value": 30, "max": 60},
                    "COMIDA_DESHIDRATADA_KG": {"value": 80, "max": 200}
                },
                "priority_weight": 0.9
            },
            "INVERNADERO_BETA": {
                "requirements": {
                    "BATERIAS_ION_KW": {"value": 500, "max": 1000},
                    "AISLAMIENTO_TERMICO_M2": {"value": 80, "max": 200},
                    "UNIDADES_PRESION_ATM": {"value": 40, "max": 80}
                },
                "priority_weight": 0.55
            },
            "SISTEMA_COMUNICACIONES": {
                "requirements": {
                    "BATERIAS_ION_KW": {"value": 300, "max": 600},
                    "AISLAMIENTO_TERMICO_M2": {"value": 40, "max": 100},
                    "FILTROS_AIRE_UNIDADES": {"value": 5, "max": 15}
                },
                "priority_weight": 0.65
            },
            "EXPLORACION_SUPERFICIE": {
                "requirements": {
                    "FILTROS_AIRE_UNIDADES": {"value": 10, "max": 25},
                    "BATERIAS_ION_KW": {"value": 200, "max": 400},
                    "COMIDA_DESHIDRATADA_KG": {"value": 30, "max": 80},
                    "AISLAMIENTO_TERMICO_M2": {"value": 30, "max": 80}
                },
                "priority_weight": 0.3
            },
            "REFUGIO_EMERGENCIA": {
                "requirements": {
                    "FILTROS_AIRE_UNIDADES": {"value": 20, "max": 40},
                    "BATERIAS_ION_KW": {"value": 300, "max": 600},
                    "UNIDADES_PRESION_ATM": {"value": 25, "max": 50},
                    "COMIDA_DESHIDRATADA_KG": {"value": 100, "max": 200}
                },
                "priority_weight": 0.8
            }
        }
    }
]

def get_templates():
    return [DynamicTemplate(**t) for t in TEMPLATES]

def get_template(template_id: str) -> DynamicTemplate:
    for t in TEMPLATES:
        if t["template_id"] == template_id:
            return DynamicTemplate(**t)
    return DynamicTemplate(**TEMPLATES[0])
