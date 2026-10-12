from datetime import date


def hitung_usia(lahir: date, today: date) -> int:
    """Atribut turunan ibu_hamil.usia (tidak disimpan)."""
    return today.year - lahir.year - ((today.month, today.day) < (lahir.month, lahir.day))
