from PIL import Image, ImageDraw, ImageFont
import os

# Criar uma imagem teste de cavalo
width, height = 800, 600
image = Image.new('RGB', (width, height), color='#87CEEB')
draw = ImageDraw.Draw(image)

# Desenhar um cavalo simples
# Corpo
draw.ellipse([300, 250, 500, 350], fill='#8B4513', outline='#654321', width=2)
# Pernas
for x in [320, 360, 420, 460]:
    draw.rectangle([x, 340, x+20, 450], fill='#654321')
# Pescoço
draw.ellipse([250, 200, 330, 280], fill='#8B4513', outline='#654321', width=2)
# Cabeça
draw.ellipse([220, 180, 280, 230], fill='#8B4513', outline='#654321', width=2)
# Olho
draw.ellipse([235, 195, 245, 205], fill='black')
# Cauda
draw.arc([480, 270, 550, 350], start=150, end=270, fill='#654321', width=8)
# Crina
for i in range(5):
    y = 200 + i * 10
    draw.arc([270 + i*5, y, 290 + i*5, y+20], start=0, end=90, fill='#654321', width=4)

# Adicionar texto
try:
    # Tentar usar uma fonte padrão do sistema
    from PIL import ImageFont
    font_large = ImageFont.truetype("arial.ttf", 36)
    font_small = ImageFont.truetype("arial.ttf", 24)
except:
    # Se não encontrar, usar fonte padrão
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Título
text = "Teste Raça Correta"
bbox = draw.textbbox((0, 0), text, font=font_large)
text_width = bbox[2] - bbox[0]
draw.text((width//2 - text_width//2, 50), text, fill='#333333', font=font_large)

# Subtítulo
subtitle = "Quarto de Milha - Alazã - 2020"
bbox = draw.textbbox((0, 0), subtitle, font=font_small)
text_width = bbox[2] - bbox[0]
draw.text((width//2 - text_width//2, 100), subtitle, fill='#666666', font=font_small)

# Adicionar marca d'água
watermark = "FOTO TESTE"
bbox = draw.textbbox((0, 0), watermark, font=font_large)
text_width = bbox[2] - bbox[0]
draw.text((width//2 - text_width//2, height - 100), watermark, fill=(255, 255, 255, 128), font=font_large)

# Salvar a imagem
output_path = os.path.join(os.getcwd(), 'test-horse.jpg')
image.save(output_path, 'JPEG', quality=95)
print(f"Imagem criada com sucesso: {output_path}")






