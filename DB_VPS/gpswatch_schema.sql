--
-- PostgreSQL database dump
--

\restrict gJbQ1obmyUrqwO9krj5MfuxNd8NfIugjqv413r8VPvL6Qwy9WwwgXnJ8S86wKaj

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: cleanup_old_data(); Type: FUNCTION; Schema: public; Owner: gpsuser
--

CREATE FUNCTION public.cleanup_old_data() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Mantiene solo ultimi 30 giorni di logs
    DELETE FROM device_config WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM device_functions WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM sms_reminder_status WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM unknown_commands WHERE timestamp < NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Pulizia vecchi dati completata';
END;
$$;


ALTER FUNCTION public.cleanup_old_data() OWNER TO gpsuser;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: gpsuser
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO gpsuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alarms; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.alarms (
    id integer NOT NULL,
    device_id integer,
    imei character varying(20) NOT NULL,
    alarm_type character varying(50) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    acknowledged boolean DEFAULT false,
    acknowledged_at timestamp without time zone,
    raw_data text,
    recorded_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.alarms OWNER TO gpsuser;

--
-- Name: alarms_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.alarms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alarms_id_seq OWNER TO gpsuser;

--
-- Name: alarms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.alarms_id_seq OWNED BY public.alarms.id;


--
-- Name: device_config; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.device_config (
    id integer NOT NULL,
    imei character varying(20) NOT NULL,
    config_data jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.device_config OWNER TO gpsuser;

--
-- Name: device_config_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.device_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.device_config_id_seq OWNER TO gpsuser;

--
-- Name: device_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.device_config_id_seq OWNED BY public.device_config.id;


--
-- Name: device_functions; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.device_functions (
    id integer NOT NULL,
    imei character varying(20) NOT NULL,
    functions_data jsonb,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.device_functions OWNER TO gpsuser;

--
-- Name: device_functions_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.device_functions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.device_functions_id_seq OWNER TO gpsuser;

--
-- Name: device_functions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.device_functions_id_seq OWNED BY public.device_functions.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    imei character varying(20) NOT NULL,
    name character varying(100),
    owner_name character varying(100),
    owner_phone character varying(20),
    sos_numbers text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    registration_code character varying(20)
);


ALTER TABLE public.devices OWNER TO gpsuser;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO gpsuser;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: geofences; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.geofences (
    id integer NOT NULL,
    device_id integer,
    name character varying(100),
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    radius integer NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.geofences OWNER TO gpsuser;

--
-- Name: geofences_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.geofences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.geofences_id_seq OWNER TO gpsuser;

--
-- Name: geofences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.geofences_id_seq OWNED BY public.geofences.id;


--
-- Name: health_data; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.health_data (
    id integer NOT NULL,
    device_id integer,
    imei character varying(20) NOT NULL,
    heart_rate integer,
    systolic_bp integer,
    diastolic_bp integer,
    spo2 integer,
    temperature numeric(4,1),
    temperature_mode character varying(20),
    raw_data text,
    recorded_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.health_data OWNER TO gpsuser;

--
-- Name: health_data_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.health_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.health_data_id_seq OWNER TO gpsuser;

--
-- Name: health_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.health_data_id_seq OWNED BY public.health_data.id;


--
-- Name: health_metrics; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.health_metrics (
    id integer NOT NULL,
    imei character varying(20),
    metric_type character varying(10),
    value1 integer,
    value2 integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_metrics OWNER TO gpsuser;

--
-- Name: health_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.health_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.health_metrics_id_seq OWNER TO gpsuser;

--
-- Name: health_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.health_metrics_id_seq OWNED BY public.health_metrics.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    device_id integer,
    imei character varying(20) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    altitude numeric(8,2),
    speed numeric(6,2),
    direction numeric(5,2),
    accuracy numeric(6,2),
    satellites integer,
    battery integer,
    steps integer,
    gsm_signal integer,
    gps_valid boolean DEFAULT true,
    raw_data text,
    recorded_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO gpsuser;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locations_id_seq OWNER TO gpsuser;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: sms_reminder_status; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.sms_reminder_status (
    id integer NOT NULL,
    imei character varying(20) NOT NULL,
    status_data text,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sms_reminder_status OWNER TO gpsuser;

--
-- Name: sms_reminder_status_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.sms_reminder_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sms_reminder_status_id_seq OWNER TO gpsuser;

--
-- Name: sms_reminder_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.sms_reminder_status_id_seq OWNED BY public.sms_reminder_status.id;


--
-- Name: unknown_commands; Type: TABLE; Schema: public; Owner: gpsuser
--

CREATE TABLE public.unknown_commands (
    id integer NOT NULL,
    imei character varying(20) NOT NULL,
    command character varying(50),
    data text,
    "timestamp" timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.unknown_commands OWNER TO gpsuser;

--
-- Name: unknown_commands_id_seq; Type: SEQUENCE; Schema: public; Owner: gpsuser
--

CREATE SEQUENCE public.unknown_commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.unknown_commands_id_seq OWNER TO gpsuser;

--
-- Name: unknown_commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gpsuser
--

ALTER SEQUENCE public.unknown_commands_id_seq OWNED BY public.unknown_commands.id;


--
-- Name: alarms id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.alarms ALTER COLUMN id SET DEFAULT nextval('public.alarms_id_seq'::regclass);


--
-- Name: device_config id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.device_config ALTER COLUMN id SET DEFAULT nextval('public.device_config_id_seq'::regclass);


--
-- Name: device_functions id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.device_functions ALTER COLUMN id SET DEFAULT nextval('public.device_functions_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: geofences id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.geofences ALTER COLUMN id SET DEFAULT nextval('public.geofences_id_seq'::regclass);


--
-- Name: health_data id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_data ALTER COLUMN id SET DEFAULT nextval('public.health_data_id_seq'::regclass);


--
-- Name: health_metrics id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_metrics ALTER COLUMN id SET DEFAULT nextval('public.health_metrics_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: sms_reminder_status id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.sms_reminder_status ALTER COLUMN id SET DEFAULT nextval('public.sms_reminder_status_id_seq'::regclass);


--
-- Name: unknown_commands id; Type: DEFAULT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.unknown_commands ALTER COLUMN id SET DEFAULT nextval('public.unknown_commands_id_seq'::regclass);


--
-- Name: alarms alarms_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_pkey PRIMARY KEY (id);


--
-- Name: device_config device_config_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.device_config
    ADD CONSTRAINT device_config_pkey PRIMARY KEY (id);


--
-- Name: device_functions device_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.device_functions
    ADD CONSTRAINT device_functions_pkey PRIMARY KEY (id);


--
-- Name: devices devices_imei_key; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_imei_key UNIQUE (imei);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: devices devices_registration_code_key; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_registration_code_key UNIQUE (registration_code);


--
-- Name: geofences geofences_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.geofences
    ADD CONSTRAINT geofences_pkey PRIMARY KEY (id);


--
-- Name: health_data health_data_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_data
    ADD CONSTRAINT health_data_pkey PRIMARY KEY (id);


--
-- Name: health_metrics health_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_metrics
    ADD CONSTRAINT health_metrics_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: sms_reminder_status sms_reminder_status_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.sms_reminder_status
    ADD CONSTRAINT sms_reminder_status_pkey PRIMARY KEY (id);


--
-- Name: unknown_commands unknown_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.unknown_commands
    ADD CONSTRAINT unknown_commands_pkey PRIMARY KEY (id);


--
-- Name: idx_alarms_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_alarms_imei ON public.alarms USING btree (imei);


--
-- Name: idx_alarms_recorded; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_alarms_recorded ON public.alarms USING btree (recorded_at DESC);


--
-- Name: idx_device_config_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_device_config_imei ON public.device_config USING btree (imei);


--
-- Name: idx_device_config_timestamp; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_device_config_timestamp ON public.device_config USING btree ("timestamp");


--
-- Name: idx_device_functions_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_device_functions_imei ON public.device_functions USING btree (imei);


--
-- Name: idx_device_functions_timestamp; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_device_functions_timestamp ON public.device_functions USING btree ("timestamp");


--
-- Name: idx_health_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_health_imei ON public.health_data USING btree (imei);


--
-- Name: idx_health_recorded; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_health_recorded ON public.health_data USING btree (recorded_at DESC);


--
-- Name: idx_locations_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_locations_imei ON public.locations USING btree (imei);


--
-- Name: idx_locations_recorded; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_locations_recorded ON public.locations USING btree (recorded_at DESC);


--
-- Name: idx_sms_reminder_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_sms_reminder_imei ON public.sms_reminder_status USING btree (imei);


--
-- Name: idx_sms_reminder_timestamp; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_sms_reminder_timestamp ON public.sms_reminder_status USING btree ("timestamp");


--
-- Name: idx_unknown_commands_command; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_unknown_commands_command ON public.unknown_commands USING btree (command);


--
-- Name: idx_unknown_commands_imei; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_unknown_commands_imei ON public.unknown_commands USING btree (imei);


--
-- Name: idx_unknown_commands_timestamp; Type: INDEX; Schema: public; Owner: gpsuser
--

CREATE INDEX idx_unknown_commands_timestamp ON public.unknown_commands USING btree ("timestamp");


--
-- Name: devices update_devices_updated_at; Type: TRIGGER; Schema: public; Owner: gpsuser
--

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alarms alarms_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: geofences geofences_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.geofences
    ADD CONSTRAINT geofences_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: health_data health_data_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_data
    ADD CONSTRAINT health_data_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: health_metrics health_metrics_imei_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.health_metrics
    ADD CONSTRAINT health_metrics_imei_fkey FOREIGN KEY (imei) REFERENCES public.devices(imei);


--
-- Name: locations locations_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gpsuser
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- PostgreSQL database dump complete
--

\unrestrict gJbQ1obmyUrqwO9krj5MfuxNd8NfIugjqv413r8VPvL6Qwy9WwwgXnJ8S86wKaj

