managed implementation in class /COSS/BP_R_EVENT unique;
strict ( 2 );
with draft;
extensible;

define behavior for /COSS/R_EVENT alias /coss/rEvent
persistent table /COSS/EVENT
draft table /COSS/EVENT_D
lock master total etag LastChangedAt
authorization master ( global )
etag master LocalLastChangedAt
extensible
{
  field ( numbering : managed, readonly )
    EventUUID;

  field ( readonly )
    CreatedBy,
    ChangedBy,
    LocalLastChangedAt,
    LastChangedAt;

  create;
  update;
  delete;

  draft action Activate optimized;
  draft action Discard;
  draft action Edit;
  draft action Resume;
  draft determine action Prepare;

  mapping for /COSS/EVENT corresponding extensible
  {
    EventUUID          = EVENT_UUID;
    EventID            = EVENT_ID;
    EventName          = EVENT_NAME;
    Location           = LOCATION;
    IsOnline           = IS_ONLINE;
    DateFrom           = DATE_FROM;
    DateTo             = DATE_TO;
    CreatedBy          = CREATED_BY;
    ChangedBy          = CHANGED_BY;
    LocalLastChangedAt = LOCAL_LAST_CHANGED_AT;
    LastChangedAt      = LAST_CHANGED_AT;
  }
}