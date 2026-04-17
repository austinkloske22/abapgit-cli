  METHOD if_oo_adt_classrun~main.

    DATA lt_event TYPE STANDARD TABLE OF /coss/event WITH EMPTY KEY.

    GET TIME STAMP FIELD DATA(lv_timestamp).

    TRY.
        lt_event = VALUE #(  (
            event_uuid  = cl_system_uuid=>create_uuid_x16_static( )
            event_id    = 'E001'
            event_name  = 'Figure out BTP ABAP Environment Tenancy'
            location    = 'Haarlem'
            is_online   = abap_true
            date_from   = '20260416'
            date_to     = '20260426'
            local_last_changed_at = lv_timestamp
            last_changed_at       =  lv_timestamp )
            (
            event_uuid  = cl_system_uuid=>create_uuid_x16_static( )
            event_id    = 'E002'
            event_name  = 'Chicago'
            location    = 'Somewhere else in the World'
            is_online   = abap_true
            date_from   = '20260516'
            date_to     = '20260526'
            local_last_changed_at = lv_timestamp
            last_changed_at       =  lv_timestamp ) ).
         CATCH cx_uuid_error.
         "handle exception
     ENDTRY.

     DELETE FROM /coss/event.
     INSERT /coss/event FROM TABLE @lt_event.
     COMMIT WORK.


     out->write( | { sy-dbcnt } entries modified| ).

  ENDMETHOD.