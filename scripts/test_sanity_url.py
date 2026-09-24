import json
import urllib.request

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def sanity_ref_to_url(ref, project_id="upy9gq1a", dataset="production"):
    # ref: image-574a5b6722ab3c173ccf8cfa250ad9e2681051bd-1527x1628-png
    if not ref or not ref.startswith("image-"):
        return ""
    rest = ref[len("image-"):]
    # last dash precedes format (e.g. -png -> .png, -jpg -> .jpg)
    r_idx = rest.rfind("-")
    if r_idx == -1:
        return ""
    filename = rest[:r_idx] + "." + rest[r_idx+1:]
    return f"https://cdn.sanity.io/images/{project_id}/{dataset}/{filename}"

def test_sanity_url():
    test_ref = "image-574a5b6722ab3c173ccf8cfa250ad9e2681051bd-1527x1628-png"
    url = sanity_ref_to_url(test_ref)
    print("Constructed URL:", url)
    
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req) as resp:
        print("Status code:", resp.status)
        print("Content length:", len(resp.read()))

if __name__ == "__main__":
    test_sanity_url()
