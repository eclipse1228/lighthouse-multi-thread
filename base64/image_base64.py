'''
Lighthouse에서 스크린샷을 저장하는 방식인 base64 endcoding 방식 (이미지,동영상) 을 인코딩합니다. ㅌ
'''
import base64
from PIL import Image
import io

def image_to_base64(image_path):
    """
    로컬 이미지를 Base64로 변환하는 함수
    :param image_path: 변환하려는 이미지의 경로
    :return: Base64 문자열
    """
    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string.decode("utf-8")
    except FileNotFoundError:
        return "파일을 찾을 수 없습니다. 경로를 확인하세요."
    except Exception as e:
        return f"오류 발생: {str(e)}"
    
    with open ("image_base64.txt", "w") as f:
        f.write(encoded_string)

def base64_to_webp(base64_string, output_path):
    """
    Base64 문자열을 디코딩하여 .webp 이미지로 저장하는 함수
    :param base64_string: Base64 문자열
    :param output_path: 저장할 .webp 파일 경로
    """
    try:
        # Base64 디코딩
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        # .webp로 저장
        image.save(output_path, format="WEBP")
        print(f"이미지가 성공적으로 {output_path}에 저장되었습니다.")
    except Exception as e:
        print(f"오류 발생: {str(e)}")

# 1. 로컬 이미지 경로
image_path = "image.jpg"  # 변환할 이미지 경로

# 2. Base64로 변환
base64_result = image_to_base64(image_path)

if base64_result.startswith("오류 발생") or base64_result.startswith("파일을 찾을 수 없습니다"):
    print(base64_result)
else:
    # 3. .webp 파일로 저장할 경로
    output_webp_path = "output_image.webp"  # 저장할 .webp 파일 경로
    
    # 4. Base64를 .webp로 변환 및 저장
    base64_to_webp(base64_result, output_webp_path)
