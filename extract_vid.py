from pathlib import Path
from lark import Lark, Transformer
import json

class VendorTransformer(Transformer):
    def start(self, items):
        return items

    def vendor(self, items):
        vendor_id = str(items[0])
        name = str(items[1]).strip()

        children = [
            {
                "id": str(item[0]),
                "name": str(item[1]).strip(),
            }
            for item in items[2:]
        ]

        return {
            "id": vendor_id,
            "name": name,
            "devices": children,
        }

    def child(self, items):
        return items


parser = Lark.open(
    "vendors.lark",
    rel_to=__file__,
    parser="lalr",
)


text = Path("data/usb.ids").read_text(encoding="utf-8")

tree = parser.parse(text)
data = VendorTransformer().transform(tree)

all_vendors = {}
full_list = {}

for vendor in data:
    print(vendor)
    all_vendors[vendor["id"]] = vendor["name"]
    full_list[vendor["id"]] = vendor
print(all_vendors)


with open("public/vendors.json", "w", encoding="utf-8") as f:
    json.dump(all_vendors, f, indent=2, ensure_ascii=False)

with open("full_list.json", "w", encoding="utf-8") as f:
    json.dump(full_list, f, indent=2, ensure_ascii=False)