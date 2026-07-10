from apps.pqm.models.dropdown_option import PQMDropdownOption
print('COUNT:', PQMDropdownOption.all_objects.count())
for o in PQMDropdownOption.all_objects.all():
    print(o.field_type, o.name)
