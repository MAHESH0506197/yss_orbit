from pathlib import Path

replacements = {
    '"file_storage.FileAsset"': '"platform.FileAsset"',
    "'file_storage.FileAsset'": "'platform.FileAsset'",
    '"users.User"': '"iam.User"',
    "'users.User'": "'iam.User'",
    '"subscription.PlatformModule"': '"tenancy.PlatformModule"',
    "'subscription.PlatformModule'": "'tenancy.PlatformModule'",
    '"business_domain.BusinessDomain"': '"organization.BusinessDomain"',
    "'business_domain.BusinessDomain'": "'organization.BusinessDomain'",
    '"business_unit.BusinessUnit"': '"organization.BusinessUnit"',
    "'business_unit.BusinessUnit'": "'organization.BusinessUnit'",
    '"user_business_unit.UserBusinessUnit"': '"organization.UserBusinessUnit"',
    "'user_business_unit.UserBusinessUnit'": "'organization.UserBusinessUnit'",
}

for p in Path('C:/PROJECT/yss_orbit/backend/apps').rglob('*.py'):
    try:
        content = p.read_text(encoding='utf-8')
        new_content = content
        for k, v in replacements.items():
            new_content = new_content.replace(k, v)
        if content != new_content:
            p.write_text(new_content, encoding='utf-8')
            print(f'Fixed {p.name}')
    except Exception as e:
        pass
