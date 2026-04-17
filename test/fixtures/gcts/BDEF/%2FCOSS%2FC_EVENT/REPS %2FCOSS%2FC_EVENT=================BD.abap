projection implementation in class /COSS/BP_C_EVENT unique;
strict ( 2 );
extensible;
use draft;
use side effects;
define behavior for /COSS/C_EVENT alias /coss/cEvent
extensible
use etag
{
  use create;
  use update;
  use delete;

  use action Edit;
  use action Activate;
  use action Discard;
  use action Resume;
  use action Prepare;

}